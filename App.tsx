
import React, { useState, useEffect } from 'react';
import { AppMode, ChatMessage } from './types';
import { LOGO_ICON, SPARK_ICON, MAGIC_ICON } from './constants';
import ChatInterface from './components/ChatInterface';
import ToolPanel from './components/ToolPanel';
import LiveSession from './components/LiveSession';
import AIDirectory from './components/AIDirectory';
import { Search, Plus, Trash2, Edit3, MessageSquare, History, Settings, ExternalLink } from 'lucide-react';

import { cn } from './lib/utils';

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);
  const [chats, setChats] = useState<{id: string, name: string, messages: ChatMessage[], persona: string}[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isThinkingModeEnabled, setIsThinkingModeEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiKeySelected, setApiKeySelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // New States for AI Directory
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [activePersona, setActivePersona] = useState<string>("DB GPT");

  // Load first chat or create one
  useEffect(() => {
    if (chats.length === 0) {
      const newChat = { id: '1', name: 'New Chat', messages: [], persona: 'DB GPT' };
      setChats([newChat]);
      setActiveChatId('1');
    }
  }, [chats]);

  const activeChat = chats.find(c => c.id === activeChatId);

  const startNewChat = () => {
    const id = Date.now().toString();
    const newChat = { id, name: `Chat ${chats.length + 1}`, messages: [], persona: 'DB GPT' };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(id);
    setActivePersona("DB GPT");
  };

  const updateActiveChatMessages = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    setChats(prev => prev.map(c => 
      c.id === activeChatId ? { ...c, messages: updater(c.messages) } : c
    ));
  };

  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats(prev => {
      const filtered = prev.filter(c => c.id !== id);
      if (activeChatId === id) {
        setActiveChatId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  const renameChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt("Enter new chat name:");
    if (newName) {
      setChats(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
    }
  };

  const filteredChats = chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
    updateActiveChatMessages(prev => [...prev, 
      { 
        id: Date.now().toString(), 
        role: 'user', 
        parts: [{ text: `Activate ${tool} mode.` }], 
        timestamp: new Date() 
      },
      { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        parts: [{ text: `${tool} mode activated. I am now ready to help you with my ${category} expertise.` }], 
        timestamp: new Date() 
      }
    ]);
    
    // Update chat name if it's "New Chat"
    if (activeChat?.name === "New Chat") {
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, name: tool, persona: tool } : c));
    }
  };

  const bgGradient = "bg-[#020617]";

  return (
    <div className={`flex h-screen w-full rainbow-mesh text-slate-50 overflow-hidden relative font-sans`}>
      {/* Background with magical glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none animate-pulse [animation-delay:2s]" />
      
      <AIDirectory 
        isOpen={isDirectoryOpen} 
        onClose={() => setIsDirectoryOpen(false)} 
        onSelect={handlePersonaSelect} 
      />

      {/* Sidebar - Modern ChatGPT Style */}
      <aside
        className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-500 bg-[#0f172a]/80 backdrop-blur-3xl flex flex-col z-30 overflow-hidden relative border-r border-white/5 shadow-2xl`}
      >
        <div className="p-4 flex flex-col h-full">
          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all mb-4 border border-white/10 group shadow-lg"
          >
            <Plus className="w-5 h-5 text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-semibold tracking-tight">New Chat</span>
          </button>
          
          <button
            onClick={() => setIsDirectoryOpen(true)}
            className="flex items-center gap-3 px-4 py-3 magical-gradient hover:opacity-90 text-white rounded-xl transition-all mb-4 border border-white/20 shadow-xl group"
          >
             <span className="group-hover:rotate-12 transition-transform duration-300 text-xl">🪐</span>
             <span className="font-bold text-[10px] tracking-widest uppercase">Explore Universe</span>
          </button>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-[11px] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600 font-bold uppercase tracking-widest"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar px-1">
            <div className="flex items-center gap-2 px-2 mb-2 text-slate-500 uppercase text-[9px] font-black tracking-[0.3em]">
              <History className="w-3 h-3" />
              <span>Recent Conversations</span>
            </div>
            
            {filteredChats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => { setActiveChatId(chat.id); setActivePersona(chat.persona); }}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all border shadow-sm",
                  activeChatId === chat.id 
                    ? "bg-white/10 border-white/10 text-white" 
                    : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg",
                  activeChatId === chat.id ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-600"
                )}>
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold truncate flex-1 tracking-tight">
                  {chat.name}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => renameChat(chat.id, e)} className="p-1 hover:text-cyan-400 transition-colors"><Edit3 className="w-3 h-3" /></button>
                  <button onClick={(e) => deleteChat(chat.id, e)} className="p-1 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Sidebar Actions */}
          <div className="mt-auto pt-6 space-y-3">
             <div className="p-4 bg-gradient-to-br from-violet-600/20 to-cyan-600/20 rounded-2xl border border-white/10 space-y-3 backdrop-blur-md">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full animate-pulse ${apiKeySelected ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-slate-500'}`} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{apiKeySelected ? 'Pro Engine Enabled' : 'Standard Mode'}</p>
                </div>
                {!apiKeySelected && (
                  <button
                    onClick={handleSelectApiKey}
                    className="w-full py-2.5 magical-gradient text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg hover:shadow-cyan-500/20 transition-all active:scale-95"
                  >
                    Unlock Pro Features
                  </button>
                )}
              </div>
              <p className="text-[9px] text-slate-400/60 text-center leading-tight">Video & High-Res Generation require a Pro API Key.</p>
            </div>
            
            <div className="flex flex-col gap-1">
              <button className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <a 
                href="https://ai.google.dev" 
                target="_blank" 
                rel="noreferrer" 
                className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Documentation
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white border border-transparent hover:border-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="p-1 px-2.5 magical-gradient rounded-lg shadow-lg">
                <span className="text-sm font-black text-white tracking-widest uppercase">DB</span>
              </div>
              <span className="text-xl font-black text-slate-50 tracking-tight db-font uppercase">GPT</span>
              {activePersona !== "DB GPT" && (
                <div className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 text-violet-300 rounded-full text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                  {activePersona}
                </div>
              )}
            </div>
            
            <nav className="hidden md:flex items-center gap-1 ml-6 p-1 bg-white/5 rounded-xl border border-white/10">
              <button className="px-4 py-2 bg-white/10 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg">Chat</button>
              <button className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">Notebook</button>
              <button className="px-4 py-2 text-slate-400 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">Research</button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsThinkingModeEnabled(!isThinkingModeEnabled)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${isThinkingModeEnabled ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500'}`}
              title="Magical Reasoning"
            >
              {SPARK_ICON}
              <span className="text-[10px] font-black uppercase tracking-widest">Reasoning</span>
            </button>
            <div 
              className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-violet-600 shadow-xl shadow-cyan-900/40 cursor-pointer border-2 border-white/20 hover:scale-110 transition-all animate-float" 
              onClick={() => setMode(mode === AppMode.CHAT ? AppMode.LIVE : AppMode.CHAT)}
              title="Live Voice Session"
            ></div>
          </div>
        </header>

        {/* Chat / Live Interface */}
        <div className="flex-1 relative flex flex-col items-center justify-center w-full max-w-5xl mx-auto">
          {mode === AppMode.LIVE ? (
            <LiveSession onClose={() => setMode(AppMode.CHAT)} />
          ) : (
            <ChatInterface
              messages={activeChat?.messages || []}
              setMessages={updateActiveChatMessages}
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
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.1); }
      `}} />
    </div>
  );
};

export default App;
