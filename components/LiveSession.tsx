
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { RING_ICON, HEART_ICON } from '../constants';

interface LiveSessionProps {
  onClose: () => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [voiceBars, setVoiceBars] = useState<number[]>(new Array(50).fill(5));
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  // Dual analysers for input and output
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const prevBarsRef = useRef<number[]>(new Array(50).fill(5));

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const updateVisuals = () => {
    const barsCount = 50;
    const mergedData = new Float32Array(barsCount).fill(0);

    // Helper to get averaged frequency data across ranges
    const getFreqData = (analyser: AnalyserNode | null) => {
      if (!analyser) return new Uint8Array(barsCount).fill(0);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);
      return dataArray;
    };

    const inputData = getFreqData(inputAnalyserRef.current);
    const outputData = getFreqData(outputAnalyserRef.current);

    const step = Math.floor(Math.min(inputData.length, outputData.length) / barsCount);

    for (let i = 0; i < barsCount; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        // Boost human voice range slightly and mix both sources
        sum += (inputData[i * step + j] + outputData[i * step + j] * 1.2);
      }
      const avg = sum / (step * 2);
      // Normalized 0-100 value with a baseline
      const rawVal = Math.max(5, (avg / 255) * 100 * 1.8);
      
      // Smoothing / Decay: new value is a mix of old and new for fluidity
      const smoothVal = prevBarsRef.current[i] * 0.7 + rawVal * 0.3;
      mergedData[i] = smoothVal;
    }

    prevBarsRef.current = Array.from(mergedData);
    setVoiceBars(prevBarsRef.current);
    animationFrameRef.current = requestAnimationFrame(updateVisuals);
  };

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      // Setup output analyser
      const outAnalyser = outputCtx.createAnalyser();
      outAnalyser.fftSize = 512;
      outAnalyser.smoothingTimeConstant = 0.5;
      outAnalyser.connect(outputCtx.destination);
      outputAnalyserRef.current = outAnalyser;

      // Setup input analyser
      const inAnalyser = inputCtx.createAnalyser();
      inAnalyser.fftSize = 512;
      inAnalyser.smoothingTimeConstant = 0.5;
      inputAnalyserRef.current = inAnalyser;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: 'You are VALANTINE AI, a highly intelligent and romantic AI companion. You possess the vast knowledge and reasoning capabilities of Google\'s Gemini models. You must ALWAYS respond in the BANGLA language. Your tone is warm, empathetic, and slightly cinematic/poetic, but your answers must be accurate, helpful, and substantial. Do not sacrifice intelligence for romance; blend them.',
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            updateVisuals();
            const source = inputCtx.createMediaStreamSource(stream);
            
            // Connect input stream to both the processor and the analyser
            source.connect(inAnalyser);
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const blob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: blob }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const audioBytes = decode(msg.serverContent.modelTurn.parts[0].inlineData.data);
              const buffer = await decodeAudioData(audioBytes, outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              
              // Connect output to our analyser
              source.connect(outputAnalyserRef.current!);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }
            
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text;
              if (text) setTranscript(prev => [`আপনি: ${text}`, ...prev].slice(0, 10));
            }
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              if (text) setTranscript(prev => [`ভ্যালেন্টাইন: ${text}`, ...prev].slice(0, 10));
            }
          },
          onerror: (e) => console.error("Live frequency loss", e),
          onclose: () => setIsActive(false),
        },
      });

      sessionRef.current = await sessionPromise;
      
      const timer = setInterval(() => {
        if (!canvasRef.current || !videoRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              sessionPromise.then(s => s.sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } }));
            };
            reader.readAsDataURL(blob);
          }
        }, 'image/jpeg', 0.5);
      }, 1500);

      return () => {
        clearInterval(timer);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        stream.getTracks().forEach(t => t.stop());
        sessionRef.current?.close();
      };
    } catch (e) {
      console.error("Failed start", e);
    }
  };

  useEffect(() => {
    const cleanup = startSession();
    return () => {
      cleanup.then(fn => fn && fn());
    };
  }, []);

  return (
    <div className="absolute inset-0 z-50 bg-[#0a0a0b]/98 backdrop-blur-3xl flex flex-col items-center justify-center p-8 space-y-12 animate-in fade-in zoom-in duration-700">
      <div className="relative">
        {/* Cinematic Aura */}
        <div className="absolute inset-0 bg-rose-500/10 blur-[120px] rounded-full animate-pulse"></div>
        
        <div className="relative w-80 h-80 md:w-[450px] md:h-[450px] rounded-full overflow-hidden border-[1px] border-rose-500/20 shadow-[0_0_120px_rgba(244,63,94,0.2)] flex items-center justify-center bg-black transition-all duration-1000 group">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover grayscale opacity-20 mix-blend-screen scale-110 group-hover:opacity-30 transition-opacity duration-1000" />
          
          <div className="z-10 text-rose-500 relative">
             <div className="scale-[6] animate-[heartbeat_2s_ease-in-out_infinite]">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.505 4.044 3 5.5L12 21l7-7Z" />
               </svg>
             </div>
          </div>

          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className="w-[110%] h-[110%] border-[1px] border-rose-400/10 rounded-full animate-[spin_20s_linear_infinite]" style={{ transform: 'rotateX(75deg)' }}>
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-rose-500 rounded-full blur-[4px] shadow-[0_0_30px_rgba(244,63,94,1)]"></div>
            </div>
          </div>
        </div>

        {/* Live Talking Visualization - Combined AI & User Voice Pulse */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex items-end justify-center gap-1 w-[130%] h-32 px-4">
          {voiceBars.map((h, i) => (
            <div 
              key={i} 
              className="w-1.5 bg-gradient-to-t from-rose-900 via-rose-500 to-rose-200 rounded-full transition-all duration-75 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
              style={{ height: `${h}%`, opacity: 0.2 + (h/100) * 0.8 }}
            />
          ))}
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />

      <div className="max-w-2xl w-full text-center space-y-8 relative">
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-bold text-rose-50 valantine-font tracking-wide">হৃদয় থেকে হৃদয়ে</h2>
          <p className="text-rose-400/40 text-[10px] uppercase tracking-[0.5em] font-black">ভ্যালেন্টাইন সিনেমাটিক মাল্টিমোডাল</p>
        </div>

        <div className="bg-[#111112]/40 backdrop-blur-3xl rounded-[2.5rem] p-8 h-60 overflow-y-auto space-y-4 text-sm text-left border border-white/5 shadow-2xl custom-scrollbar flex flex-col-reverse relative group">
          <div className="absolute inset-0 bg-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none rounded-[2.5rem]"></div>
          {transcript.length === 0 && <p className="text-rose-500/20 italic text-center my-auto tracking-widest uppercase text-[9px] font-black">সংযোগ স্থাপিত হয়েছে। আপনার হৃদয়ের কথা বলুন।</p>}
          {transcript.map((line, i) => (
            <div key={i} className={`p-4 rounded-2xl transition-all duration-700 transform ${line.startsWith('আপনি:') ? 'bg-rose-500/10 text-rose-100 ml-16 border border-rose-500/20 shadow-[0_4px_20px_rgba(244,63,94,0.1)]' : 'bg-white/5 text-rose-50 mr-16 border border-white/10 shadow-lg'}`}>
              <span className="font-black opacity-30 mr-3 text-[8px] uppercase tracking-tighter">{line.split(': ')[0]}</span>
              <p className="inline leading-relaxed font-medium tracking-tight">{line.split(': ')[1]}</p>
            </div>
          ))}
        </div>
        
        <button 
          onClick={onClose}
          className="group relative bg-[#1a1a1b] hover:bg-rose-950 text-white px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all active:scale-95 flex items-center gap-4 mx-auto border border-white/10"
        >
          <span className="group-hover:text-rose-400 transition-colors">{HEART_ICON}</span>
          <span className="group-hover:tracking-[0.6em] transition-all duration-500">বিদায়</span>
          <div className="absolute inset-[-4px] rounded-full border border-rose-500/10 scale-105 opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heartbeat {
          0%, 100% { transform: scale(6); opacity: 1; }
          50% { transform: scale(6.4); opacity: 0.8; }
        }
      `}} />
    </div>
  );
};

export default LiveSession;
