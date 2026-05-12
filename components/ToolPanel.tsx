
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, AspectRatio, ImageSize } from '../types';
import { ASPECT_RATIOS, IMAGE_SIZES, LOGO_ICON, SPARK_ICON } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Edit3, Wand2, Maximize2, Trash2, Camera, Sparkles, Video } from 'lucide-react';
import { cn } from '../lib/utils';

interface ToolPanelProps {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsThinking: (val: boolean) => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({ setMessages, setIsThinking }) => {
  const [activeTab, setActiveTab] = useState<'generate' | 'modify' | 'cinema'>('generate');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [status, setStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedFile(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setIsThinking(true);
    setStatus('Casting visual spell...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `High quality cinematic magical artwork: ${prompt}` }] },
        config: { imageConfig: { aspectRatio } }
      });
      let img = '';
      for (const p of response.candidates[0].content.parts) {
        if (p.inlineData) img = `data:image/png;base64,${p.inlineData.data}`;
      }
      if (img) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'ai', 
          parts: [{ text: `I have manifested your vision:`, image: img }], 
          timestamp: new Date() 
        }]);
      }
      setPrompt('');
    } catch (e) { setStatus('Magic failed...'); console.error(e); }
    finally { setIsThinking(false); setStatus(''); }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    setIsThinking(true);
    setStatus('Manifesting cinematic reality...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2-veo',
        contents: { parts: [{ text: `High definition cinematic video sequence: ${prompt}` }] },
        config: { 
           // Veo specific config if any beyond standard
        }
      });
      let videoUrl = '';
      for (const p of response.candidates[0].content.parts) {
        if (p.inlineData) videoUrl = `data:video/mp4;base64,${p.inlineData.data}`;
      }
      if (videoUrl) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'ai', 
          parts: [{ text: `The prophecy has been recorded:`, video: videoUrl }], 
          timestamp: new Date() 
        }]);
      }
      setPrompt('');
    } catch (e) { setStatus('Cinema failed...'); console.error(e); }
    finally { setIsThinking(false); setStatus(''); }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-3xl border border-white/5 overflow-hidden shadow-2xl backdrop-blur-xl">
      <div className="flex p-1 bg-white/5 m-2 rounded-2xl">
        <button
          onClick={() => setActiveTab('generate')}
          className={cn(
            "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2",
            activeTab === 'generate' ? "magical-gradient text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Wand2 className="w-3 h-3" />
          Manifest
        </button>
        <button
          onClick={() => setActiveTab('modify')}
          className={cn(
            "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2",
            activeTab === 'modify' ? "magical-gradient text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Edit3 className="w-3 h-3" />
          Evolve
        </button>
        <button
          onClick={() => setActiveTab('cinema')}
          className={cn(
            "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl flex items-center justify-center gap-2",
            activeTab === 'cinema' ? "magical-gradient text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
          )}
        >
          <Video className="w-3 h-3" />
          Cinema
        </button>
      </div>

      <div className="p-4 pt-1 space-y-4">
        {activeTab === 'modify' && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video rounded-3xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 transition-all flex flex-col items-center justify-center cursor-pointer group bg-black/20 overflow-hidden relative"
          >
            {selectedFile ? (
              <>
                <img src={selectedFile} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:magical-gradient group-hover:text-white transition-all">
                  <Image className="w-6 h-6 text-slate-500 group-hover:text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-cyan-400">Reference Image</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileSelect} />
          </div>
        )}

        <div className="relative">
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              activeTab === 'generate' ? "Describe your vision..." : 
              activeTab === 'cinema' ? "Describe your cinematic scene..." : 
              "How should we evolve this?"
            }
            className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-5 text-sm text-white outline-none focus:border-cyan-500/40 focus:ring-4 focus:ring-cyan-500/5 resize-none transition-all placeholder:text-slate-600"
            rows={4}
          />
          <Sparkles className="absolute right-4 top-4 w-4 h-4 text-cyan-400/30 group-focus-within:text-cyan-400" />
        </div>

        {(activeTab === 'generate' || activeTab === 'cinema') && (
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <label className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] px-1">Canvas Ratio</label>
              <div className="flex flex-wrap gap-2">
                {(activeTab === 'cinema' ? ["16:9", "9:16"] : ASPECT_RATIOS.slice(0, 4)).map(r => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r as AspectRatio)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                      aspectRatio === r 
                        ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" 
                        : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'cinema' && (
              <div className="space-y-2">
                <label className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] px-1">Resolution</label>
                <div className="flex gap-2">
                  {['720p', '1080p'].map(res => (
                    <button
                      key={res}
                      onClick={() => setResolution(res as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
                        resolution === res 
                          ? "bg-violet-500/10 border-violet-500/50 text-violet-400" 
                          : "bg-white/5 border-white/5 text-slate-500 hover:text-slate-300"
                      )}
                    >
                      {res}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={
            activeTab === 'generate' ? generateImage : 
            activeTab === 'cinema' ? generateVideo : 
            () => {}
          }
          className="w-full magical-gradient text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-indigo-900/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 overflow-hidden relative group db-button-glow border border-white/20"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          {activeTab === 'cinema' ? <Video className="w-4 h-4" /> : <Sparkles className="w-4 h-4 animate-pulse" />}
          {activeTab === 'generate' ? 'Manifest Vision' : activeTab === 'cinema' ? 'Manifest Cinema' : 'Evolve Memory'}
        </button>

        {status && (
          <div className="flex items-center justify-center gap-3 py-2 animate-in fade-in slide-in-from-bottom-2">
             <div className="flex gap-1">
                {[1,2,3].map(i => (
                  <div key={i} className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
             </div>
             <span className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em]">{status}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolPanel;
