
import React, { useState, useEffect } from 'react';
import { AppMode, ChatMessage } from './types';
import { HEART_ICON, RING_ICON, SPARK_ICON } from './constants';
import ChatInterface from './components/ChatInterface';
import ToolPanel from './components/ToolPanel';
import LiveSession from './components/LiveSession';
import AIDirectory from './components/AIDirectory';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isThinkingModeEnabled, setIsThinkingModeEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiKeySelected, setApiKeySelected] = useState(false);
  
  // New States for AI Directory
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [activePersona, setActivePersona] = useState<string>("VALANTINE AI");

  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setApiKeySelected(hasKey);
      } catch (e) {
        console.error("Error checking API key status", e);
      }
    };
    checkApiKey();
  }, []);

  const handleSelectApiKey = async () => {
    try {
      await window.aistudio.openSelectKey();
      setApiKeySelected(true);
    } catch (e) {
      console.error("Failed to select API key", e);
    }
  };

  const handlePersonaSelect = (tool: string, category: string) => {
    setActivePersona(tool);
    setIsDirectoryOpen(false);
    setMessages(prev => [...prev, 
      { 
        id: Date.now().toString(), 
        role: 'user', 
        parts: [{ text: `Activate ${tool} mode.` }], 
        timestamp: new Date() 
      },
      { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        parts: [{ text: `${tool} মোড সক্রিয় করা হয়েছে। এখন আমি ${category}-এর দক্ষতা ব্যবহার করে আপনাকে সাহায্য করব। (Bangla Language)` }], 
        timestamp: new Date() 
      }
    ]);
  };

  const romanticBgUrl = "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="flex h-screen w-full bg-[#131314] text-[#e3e3e3] overflow-hidden relative">
      {/* Background with overlay */}
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url(${romanticBgUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(4px)'
        }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#131314]/50 to-[#131314] pointer-events-none" />
      
      <AIDirectory 
        isOpen={isDirectoryOpen} 
        onClose={() => setIsDirectoryOpen(false)} 
        onSelect={handlePersonaSelect} 
      />

      {/* Sidebar - Gemini Style */}
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-[#1e1f20] flex flex-col z-20 overflow-hidden relative border-r border-rose-900/20 shadow-2xl`}
      >
        <div className="p-4 flex flex-col h-full">
          <button
            onClick={() => { setMessages([]); setActivePersona("VALANTINE AI"); }}
            className="flex items-center gap-3 px-4 py-3 bg-[#131314]/50 hover:bg-rose-900/20 text-rose-200 rounded-full transition-all mb-4 border border-rose-900/10"
          >
            <div className="scale-75">{HEART_ICON}</div>
            <span className="font-medium">নতুন চ্যাট</span>
          </button>
          
          <button
            onClick={() => setIsDirectoryOpen(true)}
            className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-rose-900/40 to-purple-900/40 hover:from-rose-900/60 hover:to-purple-900/60 text-white rounded-full transition-all mb-4 border border-white/10 shadow-lg group"
          >
             <span className="group-hover:rotate-12 transition-transform duration-300">🪐</span>
             <span className="font-bold text-sm tracking-wide">AI মহাবিশ্ব (AI Universe)</span>
          </button>

          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-4 px-2 opacity-60">সাম্প্রতিক</p>
            {messages.length > 0 && (
              <div className="px-3 py-2 text-sm text-rose-100/70 hover:bg-white/5 rounded-lg cursor-pointer truncate">
                {messages[messages.length - 1]?.parts[0]?.text?.substring(0, 30)}...
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 space-y-2">
            <ToolPanel
              setMessages={setMessages}
              setIsThinking={setIsThinking}
            />

            <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-500/10 space-y-3">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-[0.2em] text-center">Frequency: {apiKeySelected ? 'Premium' : 'Free'}</p>
                {!apiKeySelected && (
                  <button
                    onClick={handleSelectApiKey}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Enable Video Generation
                  </button>
                )}
              </div>
              <p className="text-[9px] text-rose-100/30 text-center leading-tight">Video features require a paid Gemini API key.</p>
              <a
                href="https://ai.google.dev/gemini-api/docs/billing"
                target="_blank"
                rel="noreferrer"
                className="block text-[8px] text-center text-rose-400/50 hover:text-rose-400 transition-colors uppercase tracking-tighter"
              >
                Billing Documentation
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-transparent">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-rose-400 valantine-font">VALANTINE AI</span>
              {activePersona !== "VALANTINE AI" && (
                <div className="px-3 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                  Mode: {activePersona}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsThinkingModeEnabled(!isThinkingModeEnabled)}
              className={`p-2 rounded-full transition-all ${isThinkingModeEnabled ? 'text-rose-400' : 'text-gray-500'}`}
              title="Reasoning Mode"
            >
              {SPARK_ICON}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-red-600 shadow-lg shadow-rose-900/40 cursor-pointer" onClick={() => setMode(mode === AppMode.CHAT ? AppMode.LIVE : AppMode.CHAT)}></div>
          </div>
        </header>

        {/* Chat / Live Interface */}
        <div className="flex-1 relative flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-4">
          {mode === AppMode.LIVE ? (
            <LiveSession onClose={() => setMode(AppMode.CHAT)} />
          ) : (
            <ChatInterface
              messages={messages}
              setMessages={setMessages}
              isThinking={isThinking}
              setIsThinking={setIsThinking}
              isThinkingModeEnabled={isThinkingModeEnabled}
              activePersona={activePersona}
              onLiveStart={() => setMode(AppMode.LIVE)}
              onResetKey={() => setApiKeySelected(false)}
            />
          )}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(225, 29, 72, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(225, 29, 72, 0.4); }
      `}} />
    </div>
  );
};

export default App;
