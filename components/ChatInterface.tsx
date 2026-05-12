
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, MessagePart, AppMode } from '../types';
import { SYSTEM_PROMPT, MAKER_INFO } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, Mic, Camera, StopCircle, 
  Copy, RotateCcw, Share2, Volume2, Languages, 
  MoreVertical, Edit, Scissors, Clipboard, 
  Eye, Download, Sparkles, Trash2, X, Maximize2,
  Code, Play, Check, ChevronRight, Brain
} from 'lucide-react';
import { cn } from '../lib/utils';

// Code Block Component with Preview
const CodeBlock = ({ language, value }: { language: string, value: string }) => {
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isPreviewable = ['html', 'css', 'javascript', 'typescript', 'react'].includes(language?.toLowerCase() || "");

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0f172a]">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 grayscale opacity-50">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">{language || 'code'}</span>
        </div>
        <div className="flex items-center gap-2">
          {isPreviewable && (
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                showPreview ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-white/5 text-slate-400"
              )}
            >
              {showPreview ? <Code className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {showPreview ? "Show Code" : "Preview"}
            </button>
          )}
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 text-slate-400 transition-all text-[10px] font-black uppercase tracking-widest"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      
      {showPreview ? (
        <div className="p-4 bg-white/5 min-h-[100px]">
          {/* Simple HTML Preview Iframe Simulation */}
          <div className="p-4 bg-white rounded-lg text-slate-900 overflow-auto max-h-[300px]">
            {language === 'html' ? (
               <div dangerouslySetInnerHTML={{ __html: value }} />
            ) : (
              <pre className="text-xs">{value}</pre>
            )}
          </div>
        </div>
      ) : (
        <pre className="p-4 overflow-x-auto custom-scrollbar text-xs font-mono text-cyan-300 selection:bg-cyan-500/30">
          <code>{value}</code>
        </pre>
      )}
    </div>
  );
};

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
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<{ type: string; url: string; name: string }[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  // AI Initialization
  const getAI = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("API Key missing. Please set GEMINI_API_KEY.");
    return new GoogleGenAI({ apiKey: key });
  };

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      parts: [
        { text: input },
        ...attachments.map(a => ({ [a.type]: a.url }))
      ],
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsThinking(true);

    try {
      const ai = getAI();
      const modelId = isThinkingModeEnabled ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
      
      const contents = messages.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: m.parts.map(p => {
          if (p.text) return { text: p.text };
          if (p.image) {
            const mimeType = p.image.split(';')[0].split(':')[1] || "image/jpeg";
            const base64Data = p.image.split(',')[1];
            return { inlineData: { data: base64Data, mimeType } };
          }
          if (p.video) {
            const mimeType = p.video.split(';')[0].split(':')[1] || "video/mp4";
            const base64Data = p.video.split(',')[1];
            return { inlineData: { data: base64Data, mimeType } };
          }
          if (p.audio) {
            const mimeType = p.audio.split(';')[0].split(':')[1] || "audio/mpeg";
            const base64Data = p.audio.split(',')[1];
            return { inlineData: { data: base64Data, mimeType } };
          }
          return { text: "" };
        })
      }));

      // Add current message parts
      const currentParts: any[] = [{ text: input || (currentAttachments.some(a => a.type === 'image') ? "Please analyze and describe the attached image(s) in detail." : "") }];
      currentAttachments.forEach(a => {
        if (a.type === 'image' || a.type === 'video' || a.type === 'audio') {
          const mimeType = a.url.split(';')[0].split(':')[1] || (a.type === 'image' ? "image/jpeg" : a.type === 'video' ? "video/mp4" : "audio/mpeg");
          const base64Data = a.url.split(',')[1];
          currentParts.push({ inlineData: { data: base64Data, mimeType } });
        }
      });

      contents.push({ role: 'user', parts: currentParts });

      const model = ai.models.generateContent({
        model: modelId,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
        }
      });

      const response = await model;
      let text = response.text || "I am confused, please try again.";

      // Force Maker Info
      if (input.toLowerCase().includes("who made you") || input.toLowerCase().includes("creator")) {
        text = MAKER_INFO;
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        parts: [{ text }],
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error("AI Error:", error);
    } finally {
      setIsThinking(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      console.error("Camera access denied", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Find a better voice if possible
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium'));
    if (premiumVoice) utterance.voice = premiumVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isTTSEnabled && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'ai' && !isThinking) {
        const textToSpeak = lastMessage.parts.map(p => p.text || "").join(" ").replace(/[*#`]/g, '');
        speakText(textToSpeak);
      }
    }
  }, [messages, isTTSEnabled, isThinking]);

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const url = canvas.toDataURL('image/jpeg');
      setAttachments(prev => [...prev, { type: 'image', url, name: `capture_${Date.now()}.jpg` }]);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio';
        setAttachments(prev => [...prev, { type, url: ev.target?.result as string, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex flex-col flex-1 w-full relative overflow-hidden bg-transparent min-h-0">
      {/* Scrollable Message Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-8 space-y-8 scroll-smooth custom-scrollbar"
      >
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center animate-pulse-glow shadow-2xl">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-4xl font-black db-font bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-tighter">
                Welcome to DB GPT
              </h2>
              <p className="max-w-md text-slate-400 font-medium">
                The magical AI built by pmb siam. I can generate, analyze, translate, and research anything you imagine.
              </p>
            </motion.div>
          )}

          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.95, filter: "brightness(1) blur(0px)" }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                scale: 1,
                filter: ["brightness(1) blur(0px)", "brightness(1.2) blur(1px)", "brightness(1) blur(0px)"],
                boxShadow: [
                  "0 0 0px rgba(255, 255, 255, 0)",
                  msg.role === 'ai' ? "0 0 30px rgba(139, 92, 246, 0.4)" : "0 0 30px rgba(34, 211, 238, 0.4)",
                  "0 0 0px rgba(255, 255, 255, 0)"
                ]
              }}
              transition={{ 
                duration: 0.6,
                boxShadow: { duration: 1.5, times: [0, 0.5, 1] },
                filter: { duration: 1, times: [0, 0.2, 1] }
              }}
              className={cn(
                "flex flex-col max-w-[85%] space-y-2 group relative",
                msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              {msg.role === 'ai' && (
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/20 via-cyan-400/20 to-fuchsia-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              )}
              
              <div className={cn(
                "px-5 py-3 rounded-2xl shadow-xl transition-all duration-300 relative overflow-hidden",
                msg.role === 'user' 
                  ? "magical-gradient text-white rounded-tr-none hover:shadow-cyan-500/20" 
                  : "glass-card text-slate-200 rounded-tl-none hover:bg-white/10"
              )}>
                {/* Magic Shimmer Effect on mount */}
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.2, ease: "easeInOut", delay: 0.3 }}
                  className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent z-10"
                />
                
                {msg.parts.map((part, pIdx) => (
                  <div key={pIdx}>
                    {part.text && (
                      <div className="markdown-body prose prose-invert prose-slate max-w-none">
                        <ReactMarkdown 
                          remarkPlugins={[remarkMath]} 
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              return !inline && match ? (
                                <CodeBlock 
                                  language={match[1]} 
                                  value={String(children).replace(/\n$/, '')} 
                                />
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {part.text}
                        </ReactMarkdown>
                      </div>
                    )}
                    {part.image && <img src={part.image} className="max-w-full rounded-2xl mt-2 shadow-2xl border border-white/10" alt="attachment" />}
                    {part.video && <video src={part.video} controls className="max-w-full rounded-2xl mt-2 shadow-2xl border border-white/10" />}
                    {part.audio && <audio src={part.audio} controls className="w-full mt-2 opacity-80" />}
                    {part.text && msg.role === 'user' && idx > 0 && part.text.startsWith('http') && (
                      <div className="mt-2 p-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 overflow-hidden">
                        <Share2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-[10px] truncate text-slate-400 font-mono italic">{part.text}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons Under Message */}
              <div className={cn(
                "flex flex-wrap items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-500 py-1",
                msg.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                {/* Standard Actions */}
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(msg.parts[0].text || "");
                    alert("Manifested to clipboard!");
                  }} 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-cyan-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>

                <button 
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      alert("Pasted from memory: " + text.substring(0, 20) + "...");
                    } catch (err) {
                      console.error('Failed to read clipboard');
                    }
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-cyan-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                >
                  <Clipboard className="w-3 h-3" />
                  <span>Paste</span>
                </button>

                <button 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-indigo-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                >
                  <Brain className="w-3 h-3" />
                  <span>Reason</span>
                </button>

                <button 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-violet-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </button>

                <button 
                  onClick={() => speakText(msg.parts.map(p => p.text || "").join(" ").replace(/[*#`]/g, ''))}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-fuchsia-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                >
                  <Volume2 className={cn("w-3 h-3", isTTSEnabled && msg.role === 'ai' && "animate-pulse")} />
                  <span>Listen</span>
                </button>

                {msg.role === 'ai' && (
                  <>
                    <button 
                      onClick={() => {
                        const lang = prompt("Translate to which language?");
                        if (lang) {
                          setInput(`Translate the message above to ${lang}: "${msg.parts[0].text?.substring(0, 100)}..."`);
                          // User can then click send
                        }
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-emerald-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                    >
                      <Languages className="w-3 h-3" />
                      <span>Translate</span>
                    </button>
                    <button 
                      onClick={() => {
                        // Resend last user message
                        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                        if (lastUserMsg) {
                          setInput(lastUserMsg.parts[0].text || "");
                          handleSend();
                        }
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-orange-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                    <button 
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-indigo-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                    >
                      <Brain className="w-3 h-3" />
                      <span>Logic</span>
                    </button>
                  </>
                )}

                {msg.role === 'user' && (
                  <>
                    <button 
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-blue-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button 
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-yellow-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                    >
                      <Scissors className="w-3 h-3" />
                      <span>Cut</span>
                    </button>
                    <button 
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-red-400 border border-transparent hover:border-white/10 transition-all text-[9px] font-black uppercase tracking-widest shadow-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}

          {isThinking && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="mr-auto glass-card px-4 py-3 rounded-2xl rounded-tl-none border-cyan-500/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 animate-pulse">DB GPT is Reasoning...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Layout Input Area */}
      <div className="w-full shrink-0">
        <div className="p-4 md:p-6 w-full max-w-4xl mx-auto">
          <div className="relative group">
          {/* Camera Preview */}
          <AnimatePresence>
            {isCameraOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="absolute bottom-full mb-4 left-0 w-full glass-card rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl z-50 p-2"
              >
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto rounded-xl" />
                <div className="flex justify-center gap-4 mt-3 pb-2">
                  <button onClick={captureImage} className="p-3 bg-cyan-500 text-white rounded-full hover:bg-cyan-600 transition-all shadow-lg active:scale-95"><Camera /></button>
                  <button onClick={stopCamera} className="p-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg active:scale-95"><X /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 px-2">
              {attachments.map((a, i) => (
                <div key={i} className="group relative w-16 h-16 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                  {a.type === 'image' && <img src={a.url} className="w-full h-full object-cover" />}
                  {a.type === 'text' && <div className="w-full h-full bg-emerald-500/20 flex items-center justify-center"><Eye className="text-emerald-400" /></div>}
                  <button 
                    onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                  >
                    <Trash2 className="w-6 h-6 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Prompt Box */}
          <div className="bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-2 border border-white/10 shadow-2xl transition-all focus-within:border-cyan-500/50 focus-within:ring-4 focus-within:ring-cyan-500/10 magical-glow relative overflow-hidden">
            {/* Colorful Bars */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 via-cyan-400 to-fuchsia-500 animate-pulse" />
            
            <div className="flex items-end gap-2 px-2 py-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                multiple 
                className="hidden" 
                accept="image/*,video/*,audio/*"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-2xl transition-all transform hover:rotate-12"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => {
                  const url = prompt("Enter social media video link (Youtube, TikTok, etc.):");
                  if (url) {
                    setAttachments(prev => [...prev, { type: 'text', url, name: 'Social Link' }]);
                  }
                }}
                className="p-3 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-2xl transition-all"
              >
                <Eye className="w-5 h-5" />
              </button>
              
              {!isCameraOpen && (
                <button 
                  onClick={startCamera}
                  className="p-3 text-slate-400 hover:text-fuchsia-400 hover:bg-white/5 rounded-2xl transition-all"
                >
                  <Camera className="w-5 h-5" />
                </button>
              )}

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask DB GPT anything..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 py-3 px-2 resize-none max-h-32 min-h-[44px] custom-scrollbar text-sm"
              />

              <div className="flex items-center gap-2">
                <button 
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      setInput(prev => prev + text);
                    } catch (err) {
                      console.error('Failed to read clipboard');
                    }
                  }}
                  className="p-3 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-2xl transition-all"
                  title="Paste"
                >
                  <Clipboard className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    setIsTTSEnabled(!isTTSEnabled);
                    if (isTTSEnabled) window.speechSynthesis.cancel();
                  }}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    isTTSEnabled ? "text-fuchsia-400 bg-fuchsia-500/10" : "text-slate-400 hover:text-fuchsia-400 hover:bg-white/5"
                  )}
                  title={isTTSEnabled ? "Disable Auto Speech" : "Enable Auto Speech"}
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button className="p-3 text-slate-400 hover:text-violet-400 hover:bg-white/5 rounded-2xl transition-all">
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() && attachments.length === 0}
                  className={cn(
                    "p-3 rounded-2xl transition-all shadow-xl active:scale-90",
                    (input.trim() || attachments.length > 0)
                      ? "magical-gradient text-white"
                      : "bg-slate-800 text-slate-600 grayscale cursor-not-allowed"
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Social Media Link Hint */}
          <div className="mt-2 flex justify-center gap-4">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
              <Eye className="w-3 h-3" />
              Analyze Social Video Links
             </p>
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 opacity-60">
              <Maximize2 className="w-3 h-3" />
              Textbook Mode Enabled
             </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
          __html: `
          .markdown-body { font-size: 14px; line-height: 1.6; }
          .markdown-body pre { background: rgba(0,0,0,0.3) !important; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin: 12px 0; position: relative; }
          .markdown-body code { font-family: var(--font-mono); font-size: 13px; color: #67e8f9; }
          .markdown-body blockquote { border-left: 4px solid #8b5cf6; padding-left: 16px; color: #94a3b8; }
          .markdown-body table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          .markdown-body th, .markdown-body td { border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; }
          .markdown-body th { background: rgba(255,255,255,0.05); }
        `}} />
    </div>
  </div>
);
};

export default ChatInterface;
