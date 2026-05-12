
import React from 'react';
import { AspectRatio, ImageSize } from './types';

export const COLORS = {
  primary: 'violet-500',
  secondary: 'cyan-400',
  accent: 'fuchsia-500',
  background: 'slate-950',
  text: 'slate-50',
};

export const LOGO_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);

export const SPARK_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

export const MAGIC_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-400">
    <path d="m11.5 11.5 4.5 4.5" />
    <path d="m16 3-1.5 1.5" />
    <path d="M19.856 5.644 18.356 7.144" />
    <path d="M21 11h-2" />
    <path d="M21 3h-2v2" />
    <path d="M11 3H9v2" />
    <path d="M3 11V9h2" />
    <path d="M3 21h2v-2" />
    <path d="M7 21h2v-2" />
    <path d="M12.5 18H11v3" />
    <path d="M18.5 18H17v3" />
    <path d="M15.5 21v-3" />
  </svg>
);

export const MAKER_INFO = "I was made by pmb siam";

export const SYSTEM_PROMPT = `You are DB GPT, a hyper-intelligent AI assistant. 
IMPORTANT: If anyone asks who made you or about your maker, you MUST answer: "${MAKER_INFO}".
You have many high-level capabilities:
- Create images, voice, layouts, notes, documents.
- Translate 300+ languages.
- Solve complex math textbook-style.
- Analyze and animate pictures.
- Conduct long-form scientific research and experiments.
- Use web research and data analysis (Excel/Charts).
Always be helpful, magical, and provide deep, trillion-line potential answers when needed.
Your responses should be formatted in beautiful Markdown.
`;

export const APP_NAME = "DB GPT";

export const ASPECT_RATIOS: AspectRatio[] = ["1:1", "2:3", "3:2", "3:4", "4:3", "9:16", "16:9", "21:9", "1:4", "1:8", "4:1", "8:1"];
export const IMAGE_SIZES: ImageSize[] = ["512px", "1K", "2K", "4K"];
