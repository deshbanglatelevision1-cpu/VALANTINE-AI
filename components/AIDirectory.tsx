
import React, { useState } from 'react';

interface AIDirectoryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tool: string, category: string) => void;
}

const AI_TOOLS = {
  "🤖 AI CHATBOTS": ["ChatGPT", "Claude", "DeepSeek", "Gemini", "Grok", "Meta AI", "MS Copilot", "Perplexity"],
  "📊 AI PRESENTATION": ["Beautiful.ai", "Gamma", "Pitch", "Plus", "PopAI", "Presentation.ai", "Slidesgo", "Tome", "Decktopus", "Slides AI", "Designs AI", "Lumens"],
  "💻 AI CODING": ["Askcodi", "Codiga", "Cursor", "GitHub Copilot", "Qodo", "Replit", "Tabnine"],
  "📧 AI EMAIL": ["Clippit.ai", "Friday", "Mailmaestro", "Shortwave", "Superhuman"],
  "🖼 AI IMAGE GEN": ["Adobe Firefly", "DALL·E", "FLUX.1", "Ideogram", "Midjourney", "Recraft", "Stable Diffusion", "Leap AI", "Gencraft", "Segmind", "Clarif AI", "Stockimg AI"],
  "📈 AI SPREADSHEET": ["Bricks", "Formula Bot", "Gigasheet", "Rows AI", "SheetAI", "Airtable"],
  "📝 AI MEETING": ["Avoma", "Equal Time", "Fathom", "Fellow.app", "Fireflies", "Krisp", "Otter", "TLDV", "Airgram", "Notify AI"],
  "⚙️ WORKFLOW": ["Integrately", "Make", "Monday.com", "n8n", "Wrike", "Zapier", "Bardeen", "UiPath", "Blue Prism", "Xembly"],
  "✍️ AI WRITING": ["Copy.ai", "Grammarly", "Jasper", "JotBot", "Quarkle", "QuillBot", "Rytr", "Sudowrite", "Writesonic", "SurferSEO", "Wordtune", "Copywriting AI"],
  "⏰ SCHEDULING": ["Calendly", "Clockwise", "Motion", "Reclaim AI", "Taskade", "Trevor AI"],
  "🎥 AI VIDEO": ["Descript", "Haiper AI", "Invideo AI", "Kling", "Krea AI", "LTX Studio", "Luma AI", "Pika AI", "Runway", "Sora", "Klap", "Opus", "Eightify", "Heygen"],
  "🧠 KNOWLEDGE": ["Mem", "Notion", "Tettra", "Notion AI", "Personal AI"],
  "🎨 GRAPHIC DESIGN": ["AutoDraw", "Canva", "Design.com", "Framer", "Microsoft Designer", "Uizard", "Flair AI", "Designify", "Clipdrop", "Crello", "Snappa"],
  "📊 DATA VIZ": ["Deckpilot", "Flourish", "Julius", "Visme", "Zing Data"],
  "🌐 WEBSITE": ["10Web", "Durable", "Divi AI", "Hostinger", "Wix ADI", "Webengage"],
  "🔍 RESEARCH": ["Bing Chat", "Clearscope", "Marketmuse", "Vidiq", "Seona AI", "BlogSEO", "Serpstat", "Wordlift", "Alli AI", "Validator AI"],
  "🗣 AUDIO/VOICE": ["Lovo AI", "Eleven Labs", "Lyrebird", "Auphonic", "Sonic AI"],
  "📣 MARKETING": ["Trypencil", "Adcreative", "AdCopy", "Simplified", "Sendbird", "Mailchimp", "Hootsuite", "Buffer", "Agorapulse", "SocialBee", "Loomly", "Zoho Social"],
  "🏷 BRANDING": ["Looka", "LogoAI", "Brandmark", "Namecheap", "Logaster", "NameLix"]
};

const AIDirectory: React.FC<AIDirectoryProps> = ({ isOpen, onClose, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-6xl h-full max-h-[90vh] bg-[#131314] border border-rose-500/20 rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Header */}
        <div className="p-6 border-b border-rose-500/10 flex items-center justify-between bg-[#1e1f20]">
          <div>
            <h2 className="text-3xl font-bold text-rose-400 valantine-font">AI মহাবিশ্ব (AI Universe)</h2>
            <p className="text-xs text-rose-200/50 uppercase tracking-widest mt-1">আপনার পছন্দের টুল বেছে নিন</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-500/20 rounded-full text-rose-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-[#131314]/50 border-b border-white/5">
          <div className="relative max-w-md mx-auto">
            <input 
              type="text" 
              placeholder="টুল খুঁজুন (যেমন: ChatGPT, Midjourney)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1e1f20] border border-rose-500/20 rounded-full py-3 px-10 text-rose-100 placeholder-rose-100/30 focus:border-rose-500 focus:outline-none transition-all"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-rose-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(AI_TOOLS).map(([category, tools]) => {
              const filteredTools = tools.filter(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
              if (filteredTools.length === 0) return null;

              return (
                <div key={category} className="bg-[#1e1f20]/50 rounded-2xl border border-white/5 p-4 hover:border-rose-500/30 transition-all group">
                  <h3 className="text-sm font-black text-rose-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {filteredTools.map(tool => (
                      <button
                        key={tool}
                        onClick={() => onSelect(tool, category)}
                        className="px-3 py-1.5 bg-[#131314] hover:bg-rose-600 text-rose-100/80 hover:text-white rounded-lg text-xs font-medium transition-all shadow-lg border border-white/5 hover:border-rose-400 hover:scale-105 active:scale-95"
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1e1f20] border-t border-rose-500/10 text-center">
          <p className="text-[10px] text-rose-400/40 font-bold uppercase tracking-[0.3em]">Full AI Directory Integration</p>
        </div>
      </div>
    </div>
  );
};

export default AIDirectory;
