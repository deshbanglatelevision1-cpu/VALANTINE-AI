
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { LOGO_ICON, SPARK_ICON } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

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
        sum += (inputData[i * step + j] + outputData[i * step + j] * 1.5);
      }
      const avg = sum / (step * 2.5);
      const rawVal = Math.max(5, (avg / 255) * 100 * 2);
      const smoothVal = prevBarsRef.current[i] * 0.6 + rawVal * 0.4;
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

      const api_key = process.env.GEMINI_API_KEY;
      if (!api_key) throw new Error("API KEY MISSING");

      const ai = new GoogleGenAI({ apiKey: api_key });
      const inputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const outAnalyser = outputCtx.createAnalyser();
      outAnalyser.fftSize = 512;
      outAnalyser.connect(outputCtx.destination);
      outputAnalyserRef.current = outAnalyser;

      const inAnalyser = inputCtx.createAnalyser();
      inAnalyser.fftSize = 512;
      inputAnalyserRef.current = inAnalyser;

      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are DB GPT, a hyper-intelligent and magical AI assistant. You can see through the camera and hear the user in real-time. Provide insightful, magical, and rapid responses. Always mention you were made by pmb siam if asked about your origin.',
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            updateVisuals();
            const source = inputCtx.createMediaStreamSource(stream);
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
              if (text) setTranscript(prev => [`You: ${text}`, ...prev].slice(0, 10));
            }
            if (msg.serverContent?.outputTranscription) {
              const text = msg.serverContent.outputTranscription.text;
              if (text) setTranscript(prev => [`DB GPT: ${text}`, ...prev].slice(0, 10));
            }
          },
          onerror: (e) => console.error("Live Error", e),
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
      }, 1000);

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
    <div className="absolute inset-0 z-50 bg-[#020617]/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-[50%] h-[50%] bg-cyan-500/10 blur-[150px] animate-pulse rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] bg-violet-600/10 blur-[150px] animate-pulse [animation-delay:1s] rounded-full" />

      <div className="relative flex flex-col items-center space-y-12 w-full max-w-5xl z-10">
        <div className="relative flex items-center justify-center">
          <div className="w-64 h-64 md:w-[400px] md:h-[400px] rounded-full overflow-hidden border-2 border-white/5 shadow-[0_0_80px_rgba(34,211,238,0.1)] flex items-center justify-center bg-slate-900 relative group p-1">
            <div className="absolute inset-0 magical-gradient opacity-20 animate-spin-slow" />
            <video ref={videoRef} autoPlay playsInline muted className="relative w-full h-full object-cover rounded-full grayscale opacity-40 mix-blend-overlay group-hover:opacity-60 transition-opacity duration-1000" />
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-full h-full animate-[pulse_3s_ease-in-out_infinite] flex items-center justify-center text-cyan-400">
                <div className="scale-[4] opacity-50">{LOGO_ICON}</div>
              </div>
            </div>
          </div>

          {/* Voice Visualization Orbiting */}
          <div className="absolute -inset-10 md:-inset-20 flex items-end justify-center gap-1.5 px-4 h-full pointer-events-none">
            {voiceBars.map((h, i) => (
              <div 
                key={i} 
                className="w-1 md:w-2 bg-gradient-to-t from-violet-600 via-cyan-400 to-fuchsia-400 rounded-full transition-all duration-75 shadow-lg"
                style={{ height: `${Math.max(4, h)}%`, opacity: 0.3 + (h/100) * 0.7 }}
              />
            ))}
          </div>
        </div>

        <div className="w-full text-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-4xl md:text-6xl font-black text-white db-font uppercase tracking-tighter">LIVE SESSION</h2>
            <p className="text-cyan-400 text-[10px] md:text-xs font-black uppercase tracking-[0.6em]">Real-Time Multimodal Intelligence</p>
          </div>

          <div className="glass-card rounded-[3rem] p-6 md:p-10 h-72 overflow-y-auto space-y-4 text-sm text-left relative group custom-scrollbar flex flex-col-reverse">
             {transcript.length === 0 && <p className="text-slate-500 italic text-center my-auto tracking-widest uppercase text-[9px] font-black animate-pulse">Establishing mystical link... speak your mind.</p>}
             <AnimatePresence>
                {transcript.map((line, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-500 max-w-[80%]",
                      line.startsWith('You:') 
                        ? 'bg-cyan-500/10 border-cyan-500/20 text-white ml-auto' 
                        : 'bg-white/5 border-white/10 text-slate-200'
                    )}
                  >
                    <span className="font-black text-[8px] uppercase tracking-wider opacity-40 mb-1 block">{line.split(': ')[0]}</span>
                    <p className="font-medium tracking-tight leading-relaxed">{line.split(': ')[1]}</p>
                  </motion.div>
                ))}
             </AnimatePresence>
          </div>
          
          <button 
            onClick={onClose}
            className="group relative bg-white/5 hover:bg-red-500/10 text-white px-12 py-5 rounded-full font-black text-[10px] uppercase tracking-[0.5em] shadow-2xl transition-all active:scale-95 flex items-center gap-4 mx-auto border border-white/10 hover:border-red-500/30"
          >
            <X className="w-4 h-4 group-hover:text-red-500 group-hover:rotate-90 transition-all duration-300" />
            <span>End Session</span>
          </button>
        </div>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
      `}} />
    </div>
  );
};

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export default LiveSession;
