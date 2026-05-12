
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, AspectRatio, ImageSize } from '../types';
import { ASPECT_RATIOS, IMAGE_SIZES, HEART_ICON } from '../constants';

interface ToolPanelProps {
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsThinking: (val: boolean) => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({ setMessages, setIsThinking }) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'edit'>('draw');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
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
    setStatus('আপনার স্বপ্ন আঁকছি...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Use Gemini 2.5 Flash for free tier image generation
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: `Real photorealistic cinematic romantic image: ${prompt}` }] },
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
          parts: [{ text: `আপনার অনুভূতির ছবি এঁকেছি:`, image: img }], 
          timestamp: new Date() 
        }]);
      }
      setPrompt('');
    } catch (e) { setStatus('কিছু ভুল হয়েছে...'); console.error(e); }
    finally { setIsThinking(false); setStatus(''); }
  };

  const editImage = async () => {
    if (!selectedFile || !prompt.trim()) return;
    setIsThinking(true);
    setStatus('স্মৃতি সাজাচ্ছি...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: selectedFile.split(',')[1], mimeType: 'image/png' } },
            { text: prompt }
          ]
        }
      });
      let img = '';
      for (const p of response.candidates[0].content.parts) {
        if (p.inlineData) img = `data:image/png;base64,${p.inlineData.data}`;
      }
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ai', 
        parts: [{ text: `ভালোবাসা দিয়ে সাজিয়েছি:`, image: img }], 
        timestamp: new Date() 
      }]);
    } catch (e) { setStatus('এডিট ব্যর্থ হয়েছে...'); }
    finally { setIsThinking(false); setStatus(''); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-white/5 bg-[#1e1f20]/50">
        <button
          onClick={() => setActiveTab('draw')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'draw' ? 'text-rose-400 border-b-2 border-rose-500 bg-rose-500/5' : 'text-white/40 hover:text-white/60'}`}
        >
          আঁকুন
        </button>
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'text-rose-400 border-b-2 border-rose-500 bg-rose-500/5' : 'text-white/40 hover:text-white/60'}`}
        >
          সম্পাদনা
        </button>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'edit' && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-video rounded-xl border-2 border-dashed border-white/10 hover:border-rose-500/40 transition-all flex flex-col items-center justify-center cursor-pointer group bg-black/20 overflow-hidden"
          >
            {selectedFile ? (
              <img src={selectedFile} className="w-full h-full object-cover" />
            ) : (
              <>
                <svg className="w-8 h-8 text-white/20 group-hover:text-rose-400/60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                <span className="text-[10px] text-white/40 group-hover:text-rose-300">রেফারেন্স ছবি</span>
              </>
            )}
            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleFileSelect} />
          </div>
        )}

        <textarea 
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={activeTab === 'draw' ? "আপনার স্বপ্নের বর্ণনা দিন..." : "এই স্মৃতিতে কী পরিবর্তন চাই?"}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-rose-500/40 resize-none"
          rows={3}
        />

        {activeTab === 'draw' && (
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase font-bold px-1">ক্যানভাস অনুপাত</label>
            <select 
              value={aspectRatio} 
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-rose-200 outline-none"
            >
              {ASPECT_RATIOS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}

        <button 
          onClick={activeTab === 'draw' ? generateImage : editImage}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-rose-900/20 transition-all active:scale-95"
        >
          {activeTab === 'draw' ? 'দৃশ্যমান করুন' : 'স্মৃতি আপডেট করুন'}
        </button>

        {status && (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping" />
            <span className="text-[10px] text-rose-400 font-medium uppercase tracking-widest">{status}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolPanel;
