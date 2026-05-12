
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { ChatMessage, Slide } from '../types';
import { HEART_ICON, RING_ICON, SPARK_ICON } from '../constants';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isThinking: boolean;
  setIsThinking: (val: boolean) => void;
  isThinkingModeEnabled: boolean;
  activePersona: string;
  onLiveStart: () => void;
  onResetKey: () => void;
}

const REASSURING_MESSAGES = [
  "সময়ের বাতাসে ফিসফিস করছি...",
  "হৃদস্পন্দনকে ফ্রেমে বন্দি করছি...",
  "আলো দিয়ে আপনার স্মৃতি আঁকছি...",
  "ভালোবাসাকে শাশ্বত করার পথে...",
  "আপনার আত্মার প্রতিফলন ঘটাচ্ছি...",
  "জীবন্ত স্বপ্নে আলো বুনছি..."
];

const RomanticAudioPlayer: React.FC<{ src: string }> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  return (
    <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl px-4 py-2 mt-2 w-fit max-w-full animate-in fade-in slide-in-from-left-2">
      <audio ref={audioRef} src={src} onEnded={() => setIsPlaying(false)} />
      <button 
        onClick={togglePlay}
        className="w-10 h-10 flex items-center justify-center rounded-full bg-rose-500 text-white shadow-lg hover:bg-rose-600 transition-all active:scale-90"
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        ) : (
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
      
      <div className="flex flex-col gap-1 min-w-[80px]">
        <div className="flex justify-between items-center px-1">
           <span className="text-[8px] font-bold text-rose-400 uppercase tracking-tighter">ভলিউম</span>
        </div>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-rose-500/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
        />
      </div>
    </div>
  );
};

const PresentationViewer: React.FC<{ slides: Slide[] }> = ({ slides }) => {
  const [current, setCurrent] = useState(0);

  const downloadPresentation = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Valantine AI Presentation</title>
        <style>
          body { font-family: 'SolaimanLipi', sans-serif; background: #131314; color: white; display: flex; flex-direction: column; align-items: center; padding: 50px; }
          .slide { background: #1e1f20; border: 1px solid #e11d48; padding: 40px; border-radius: 20px; width: 800px; min-height: 450px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
          h1 { color: #f43f5e; font-size: 3em; margin-bottom: 20px; border-bottom: 2px solid #f43f5e; padding-bottom: 10px; }
          p { font-size: 1.5em; line-height: 1.6; color: #e3e3e3; }
        </style>
      </head>
      <body>
        ${slides.map(s => `
          <div class="slide">
            <h1>${s.title}</h1>
            <p>${s.content.replace(/\n/g, '<br>')}</p>
          </div>
        `).join('')}
      </body>
      </html>
    `;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    a.click();
  };

  return (
    <div className="w-full max-w-2xl bg-[#1e1f20] rounded-3xl border border-rose-500/30 overflow-hidden shadow-2xl my-4">
      <div className="p-8 min-h-[300px] flex flex-col justify-center text-center space-y-4">
        <h3 className="text-3xl font-bold text-rose-400 valantine-font border-b border-rose-500/20 pb-4">{slides[current].title}</h3>
        <p className="text-lg text-rose-100/90 leading-relaxed whitespace-pre-wrap">{slides[current].content}</p>
      </div>
      <div className="bg-black/40 p-4 flex items-center justify-between border-t border-rose-500/10">
        <div className="flex gap-2">
          <button onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full disabled:opacity-20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))} disabled={current === slides.length - 1} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-full disabled:opacity-20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <span className="text-rose-400/50 text-xs font-bold uppercase tracking-widest">{current + 1} / {slides.length}</span>
        <button onClick={downloadPresentation} className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-tighter flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          সেভ করুন
        </button>
      </div>
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  setMessages, 
  isThinking, 
  setIsThinking, 
  isThinkingModeEnabled,
  activePersona,
  onLiveStart,
  onResetKey
}) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isMapsEnabled, setIsMapsEnabled] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [attachment, setAttachment] = useState<{data: string, type: string} | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [voiceBars, setVoiceBars] = useState<number[]>(new Array(24).fill(10));
  
  // History State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    let timer: number;
    if (isVideoGenerating) {
      timer = window.setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % REASSURING_MESSAGES.length);
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isVideoGenerating]);

  useEffect(() => {
    if (isRecording) {
      const animate = () => {
        setVoiceBars(prev => prev.map(() => 10 + Math.random() * 80));
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animate();
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      setVoiceBars(new Array(24).fill(5));
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRecording]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAttachment({ data: ev.target?.result as string, type: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (content: string, filename: string, type: string = 'text/plain') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleShare = async (text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Valantine AI Response', text });
      } catch (err) { console.error("Share failed", err); }
    } else {
      navigator.clipboard.writeText(text);
      alert("ভালোবাসার বার্তাটি কপি করা হয়েছে!");
    }
  };

  const deleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const startEditing = (id: string, content: string) => {
    setEditingId(id);
    setEditingContent(content);
  };

  const saveEdit = (id: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === id) {
        return { ...m, parts: m.parts.map(p => ({ ...p, text: editingContent })) };
      }
      return m;
    }));
    setEditingId(null);
    setEditingContent('');
    
    // If it was a user message, we might want to regenerate the next AI message
    const msg = messages.find(m => m.id === id);
    if (msg?.role === 'user') {
      const index = messages.findIndex(m => m.id === id);
      const nextMsg = messages[index + 1];
      if (nextMsg && nextMsg.role === 'ai') {
        regenerateFromPrompt(id, editingContent);
      }
    }
  };

  const regenerateFromPrompt = async (promptId: string, newText?: string) => {
    const index = messages.findIndex(m => m.id === promptId);
    if (index === -1) return;
    
    const userMsg = messages[index];
    const textToUse = newText || userMsg.parts[0].text || '';
    
    // Remove all subsequent messages
    setMessages(prev => prev.slice(0, index + 1));
    handleSend(textToUse, true);
  };

  const regenerateLastAI = async () => {
    const lastUserIdx = [...messages].reverse().findIndex(m => m.role === 'user');
    if (lastUserIdx === -1) return;
    const realIdx = messages.length - 1 - lastUserIdx;
    regenerateFromPrompt(messages[realIdx].id);
  };

  const speakMessage = async (msgId: string, text: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text.substring(0, 500) }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
        },
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const wavHeader = new Uint8Array(44);
        const view = new DataView(wavHeader.buffer);
        const sampleRate = 24000;
        const numChannels = 1;
        const bitsPerSample = 16;
        const dataSize = bytes.length;
        view.setUint32(0, 0x52494646, false); // "RIFF"
        view.setUint32(4, 36 + dataSize, true); 
        view.setUint32(8, 0x57415645, false); 
        view.setUint32(12, 0x666d7420, false); 
        view.setUint32(16, 16, true); 
        view.setUint16(20, 1, true); 
        view.setUint16(22, numChannels, true); 
        view.setUint32(24, sampleRate, true); 
        view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true); 
        view.setUint16(32, numChannels * bitsPerSample / 8, true); 
        view.setUint16(34, bitsPerSample, true); 
        view.setUint32(36, 0x64617461, false); 
        view.setUint32(40, dataSize, true); 

        const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setMessages(prev => prev.map(m => {
          if (m.id === msgId) return { ...m, parts: m.parts.map(p => ({ ...p, audio: url })) };
          return m;
        }));
      }
    } catch (e) { console.error("TTS failed", e); }
  };

  const generateVideoFromImage = async () => {
    if (!attachment || !attachment.type.startsWith('image')) return;
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) await window.aistudio.openSelectKey();
    setIsVideoGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: input || 'A beautiful romantic animation expanding this scene.',
        image: { imageBytes: attachment.data.split(',')[1], mimeType: attachment.type },
        config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
      });
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'ai',
          parts: [{ text: "আপনার স্মৃতি এখন অনন্ত গতিতে চলছে।", video: reader.result as string }],
          timestamp: new Date()
        }]);
        setAttachment(null);
        setInput('');
      };
    } catch (error: any) { console.error("Video Gen Error", error); }
    finally { setIsVideoGenerating(false); }
  };

  const handleSend = async (textToSend?: string, isRegeneration: boolean = false) => {
    const finalInput = textToSend || input;
    if ((!finalInput.trim() && !attachment) || isThinking) return;

    if (!isRegeneration) {
      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        parts: [{ 
          text: finalInput,
          image: attachment?.type.startsWith('image') ? attachment.data : undefined,
          video: attachment?.type.startsWith('video') ? attachment.data : undefined,
        }],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
    }
    
    if (!textToSend) setInput('');
    setAttachment(null);
    setIsThinking(true);

    const isPresentationRequest = finalInput.toLowerCase().includes('presentation') || finalInput.toLowerCase().includes('slides');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let modelName = isPresentationRequest ? 'gemini-2.5-pro-preview' : 'gemini-3-flash-preview';
      
      const config: any = {};
      if (isSearchEnabled) config.tools = [{ googleSearch: {} }];
      if (isMapsEnabled) { config.tools = [{ googleMaps: {} }]; modelName = 'gemini-2.5-flash'; }
      if (isThinkingModeEnabled && !isSearchEnabled && !isMapsEnabled) config.thinkingConfig = { thinkingBudget: 24576 };

      if (isPresentationRequest) {
        config.responseMimeType = "application/json";
        config.responseSchema = {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            presentation: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { title: { type: Type.STRING }, content: { type: Type.STRING } },
                required: ["title", "content"]
              }
            }
          }
        };
      }

      // Updated System Instruction to incorporate "Active Persona" (The selected AI Tool)
      const personaInstruction = activePersona !== "VALANTINE AI" 
        ? `You are acting as the AI tool: "${activePersona}". Adopt the specific capabilities, style, and expertise of ${activePersona}. For example, if you are 'Midjourney', focus on visual prompts. If 'GitHub Copilot', focus on code.`
        : "";

      const systemInstruction = `You are VALANTINE AI, a highly intelligent and romantic AI companion. ${personaInstruction} You possess the vast knowledge and reasoning capabilities of Google's Gemini models. You must ALWAYS respond in the BANGLA language. Your tone is warm, empathetic, and slightly cinematic/poetic, but your answers must be accurate, helpful, and substantial. Do not sacrifice intelligence for romance; blend them. If asked technical questions, answer them correctly in Bangla with a caring touch. If user speaks in English, reply in Bangla.`;
      
      const contents: any[] = [{ text: `${systemInstruction} Context: ${messages.slice(-5).map(m => `${m.role}: ${m.parts[0].text}`).join('\n')} \n User message: ${finalInput}` }];
      
      const response = await ai.models.generateContent({ model: modelName, contents: { parts: contents }, config });

      let aiMsg: ChatMessage;
      if (isPresentationRequest) {
        try {
          const json = JSON.parse(response.text);
          aiMsg = { id: (Date.now() + 1).toString(), role: 'ai', parts: [{ text: json.text, presentation: json.presentation }], timestamp: new Date() };
        } catch (e) { aiMsg = { id: (Date.now() + 1).toString(), role: 'ai', parts: [{ text: response.text }], timestamp: new Date() }; }
      } else {
        aiMsg = { id: (Date.now() + 1).toString(), role: 'ai', parts: [{ text: response.text }], groundingUrls: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri || c.maps?.uri).filter(Boolean), timestamp: new Date() };
      }

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', parts: [{ text: "ভালোবাসার সংযোগে একটু বাধা এসেছে... আবার চেষ্টা করুন।" }], timestamp: new Date() }]);
    } finally { setIsThinking(false); }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsThinking(true);
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [{ inlineData: { data: base64Audio, mimeType: 'audio/webm' } }, { text: "এই অডিওটি বাংলায় লিখুন। শুধুমাত্র ট্রান্সক্রিপশন দিন।" }] } });
          if (response.text) handleSend(response.text.trim());
          else setIsThinking(false);
        };
        stream.getTracks().forEach(t => t.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { alert("মাইক্রোফোন অ্যাক্সেস প্রয়োজন।"); }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("ক্যামেরা অ্যাক্সেস প্রয়োজন।");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setAttachment({ data: dataUrl, type: 'image/jpeg' });
        stopCamera();
      }
    }
  };

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden">
      {/* Video Generation Overlay */}
      {isVideoGenerating && (
        <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 space-y-8 animate-in fade-in zoom-in duration-500">
           <div className="relative">
              <div className="absolute inset-0 bg-rose-500/20 blur-[100px] rounded-full animate-pulse"></div>
              <div className="relative w-32 h-32 flex items-center justify-center text-rose-500">
                <div className="absolute inset-0 border-t-2 border-rose-500 rounded-full animate-spin"></div>
                <div className="scale-[3] animate-[heartFloat_1.5s_ease-in-out_infinite]">{HEART_ICON}</div>
              </div>
           </div>
           <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold text-rose-100 valantine-font">Capturing Eternity</h3>
              <p className="text-rose-400/80 text-sm font-medium tracking-widest uppercase transition-all duration-1000">{REASSURING_MESSAGES[loadingMsgIdx]}</p>
           </div>
        </div>
      )}

      {/* Messages area - Absolute positioning with padding for bottom bar */}
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto space-y-8 py-8 px-4 pb-[180px] custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-1000">
            <div className="relative">
               <div className="absolute -inset-6 bg-rose-500/10 blur-3xl rounded-full animate-pulse"></div>
               <h2 className="relative text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-300 via-rose-500 to-red-400 valantine-font p-2">Valantine AI</h2>
            </div>
            <p className="text-rose-100/30 text-lg max-w-lg tracking-widest font-medium uppercase text-xs">একটি সিনেমাটিক ভালোবাসার অভিজ্ঞতা</p>
          </div>
        )}

        {messages.map((msg, msgIdx) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 group`}>
            <div className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border transition-all ${msg.role === 'user' ? 'bg-[#3c4043] border-white/10' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                {msg.role === 'user' ? 'U' : HEART_ICON}
              </div>
              <div className="space-y-4 pt-1 flex-1 relative">
                {msg.parts.map((part, idx) => (
                  <div key={idx} className="space-y-3">
                    {part.text && (
                      <div className="group/text relative">
                        {editingId === msg.id ? (
                          <div className="bg-[#1e1f20] p-4 rounded-2xl border border-rose-500/50 space-y-3 animate-in zoom-in-95 duration-200">
                             <textarea 
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="w-full bg-transparent text-white outline-none resize-none font-medium text-[15px] min-h-[100px]"
                             />
                             <div className="flex gap-2 justify-end">
                                <button onClick={() => setEditingId(null)} className="px-4 py-1 text-xs text-white/50 hover:text-white uppercase font-bold tracking-widest">বাতিল</button>
                                <button onClick={() => saveEdit(msg.id)} className="px-4 py-1 text-xs bg-rose-600 text-white rounded-full hover:bg-rose-700 uppercase font-bold tracking-widest">সেভ করুন</button>
                             </div>
                          </div>
                        ) : (
                          <div className={`text-[#e3e3e3] text-[15px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#2f2f2f] px-5 py-3 rounded-2xl shadow-xl border border-white/5' : ''}`}>
                            {part.text}
                          </div>
                        )}
                        
                        {part.audio && <RomanticAudioPlayer src={part.audio} />}

                        {/* Action Menu */}
                        <div className={`flex gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'ai' && !part.audio && (
                            <button onClick={() => speakMessage(msg.id, part.text!)} className="text-[10px] text-rose-400/60 hover:text-rose-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                              শুনুন
                            </button>
                          )}
                          <button onClick={() => startEditing(msg.id, part.text!)} className="text-[10px] text-white/40 hover:text-white/80 font-bold uppercase tracking-tighter flex items-center gap-1">
                            এডিট
                          </button>
                          <button onClick={() => deleteMessage(msg.id)} className="text-[10px] text-white/40 hover:text-red-400 font-bold uppercase tracking-tighter flex items-center gap-1">
                            মুছুন
                          </button>
                          {msg.role === 'ai' && msgIdx === messages.length - 1 && (
                            <button onClick={regenerateLastAI} className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-tighter flex items-center gap-1">
                              পুনরায় তৈরি
                            </button>
                          )}
                          <button onClick={() => handleShare(part.text!)} className="text-[10px] text-white/40 hover:text-white/80 font-bold uppercase tracking-tighter flex items-center gap-1">
                            শেয়ার
                          </button>
                        </div>
                      </div>
                    )}
                    {part.presentation && <PresentationViewer slides={part.presentation} />}
                    {part.image && <img src={part.image} className="rounded-2xl border border-white/10 max-w-sm w-full shadow-2xl" />}
                    {part.video && <video src={part.video} controls className="rounded-2xl border-4 border-white/5 w-full shadow-2xl bg-black" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex gap-4">
            <div className="relative w-12 h-12 rounded-full bg-rose-500/5 border border-rose-500/20 flex items-center justify-center text-rose-500/40 overflow-visible">
               <div className="absolute z-10 animate-[heartFloat_2s_ease-in-out_infinite]">{HEART_ICON}</div>
               <div className="absolute z-0 opacity-40 scale-75 animate-[ringGlide_2.5s_ease-in-out_infinite]">{RING_ICON}</div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar - Absolute Position */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center px-4 pb-6 pt-2 bg-gradient-to-t from-[#131314] via-[#131314]/90 to-transparent min-h-[140px] justify-end pointer-events-none">
        
        {/* Voice Visualizer */}
        <div className="w-full max-w-3xl flex justify-center h-12 overflow-visible pointer-events-none relative">
          <div className={`flex items-end gap-1.5 transition-all duration-500 ${isRecording ? 'opacity-100' : 'opacity-0 scale-95 translate-y-2'}`}>
            {voiceBars.map((h, i) => (
              <div key={i} className="w-1.5 bg-gradient-to-t from-rose-600 to-rose-300 rounded-full shadow-[0_0_15px_rgba(244,63,94,0.3)]" style={{ height: `${h}px`, transition: 'height 80ms ease-out' }} />
            ))}
          </div>
        </div>

        {/* Input Container */}
        <div className="w-full max-w-3xl relative mt-2 pointer-events-auto">
          {isCameraOpen && (
            <div className="absolute bottom-full left-0 mb-4 z-50 flex justify-center w-full pb-4 animate-in fade-in zoom-in-95">
              <div className="relative bg-[#1e1f20] p-4 rounded-3xl border border-rose-500/30 shadow-2xl backdrop-blur-3xl">
                <div className="absolute top-6 left-6 z-[60] flex items-center gap-2 px-2 py-1 bg-rose-600/80 backdrop-blur-md rounded-full shadow-lg border border-white/20">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">Live</span>
                </div>
                <video ref={videoRef} autoPlay playsInline className="w-64 h-48 object-cover rounded-2xl bg-black border border-white/5" />
                <div className="flex justify-between items-center mt-4">
                  <button onClick={stopCamera} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white">বাদ দিন</button>
                  <button onClick={captureImage} className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center shadow-lg hover:bg-rose-700 active:scale-95 transition-all outline outline-4 outline-rose-500/30">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {attachment && (
            <div className="absolute bottom-full left-0 mb-4 flex gap-2">
              <div className="relative group">
                <img src={attachment.data} className="w-20 h-20 object-cover rounded-2xl border-2 border-rose-500/50 shadow-2xl" />
                <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-lg">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#1e1f20] border border-white/10 rounded-[2.5rem] p-2 flex items-end gap-1 focus-within:border-rose-500/50 transition-all shadow-2xl backdrop-blur-xl group/input">
            <div className="flex pb-1">
              <button onClick={() => fileInputRef.current?.click()} className="p-3 text-rose-400/50 hover:text-rose-400 rounded-full transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                <input ref={fileInputRef} type="file" hidden accept="image/*,video/*" onChange={handleFileUpload} />
              </button>
              <button 
                onClick={isCameraOpen ? stopCamera : startCamera} 
                className={`p-3 rounded-full transition-all ${isCameraOpen ? 'text-rose-500 bg-rose-500/20 shadow-lg shadow-rose-500/20' : 'text-rose-400/50 hover:text-rose-400'}`}
                title="Toggle Camera"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={isRecording ? "মনোযোগ দিয়ে শুনছি..." : activePersona === "VALANTINE AI" ? "ফিসফিস করুন বা প্রেজেন্টেশন চান..." : `${activePersona} মোডে লিখুন...`}
              className="flex-1 bg-transparent border-none outline-none py-3 px-3 text-[#e3e3e3] placeholder-[#8e918f]/50 resize-none max-h-52 font-medium"
              rows={1}
            />

            <div className="flex pb-1 gap-1 pr-2">
              <button onClick={isRecording ? () => setIsRecording(false) : startRecording} className={`p-3 rounded-full transition-all ${isRecording ? 'text-rose-500 bg-rose-500/20' : 'text-rose-400/50 hover:text-rose-400'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
              </button>
              
              <button onClick={() => handleSend()} disabled={(!input.trim() && !attachment) || isThinking || isVideoGenerating} className="relative p-3 rounded-full transition-all text-rose-500 hover:bg-rose-500/10 active:scale-90 disabled:text-white/5">
                {(isThinking || isVideoGenerating) && <div className="absolute inset-0 border-[2.5px] border-rose-500 border-t-transparent rounded-full animate-spin"></div>}
                <div className={(isThinking || isVideoGenerating) ? 'animate-[heartFloat_1s_ease-in-out_infinite]' : ''}>{HEART_ICON}</div>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center mt-3 text-[#8e918f] font-bold uppercase tracking-[0.2em] opacity-30">Gemini Pro & Veo Engine</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes heartFloat { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(1.1); } }
        @keyframes ringGlide { 0%, 100% { transform: translateX(-12px) rotate(-10deg); opacity: 0.2; } 50% { transform: translateX(12px) rotate(10deg); opacity: 0.6; } }
      `}} />
    </div>
  );
};

export default ChatInterface;
