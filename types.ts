
export type MessageType = 'user' | 'ai';

export interface Slide {
  title: string;
  content: string;
  imageUrl?: string;
}

export interface MessagePart {
  text?: string;
  image?: string;
  video?: string;
  audio?: string;
  thinking?: string;
  gallery?: string[];
  presentation?: Slide[];
}

export interface ChatMessage {
  id: string;
  role: MessageType;
  parts: MessagePart[];
  groundingUrls?: string[];
  timestamp: Date;
}

export enum AppMode {
  CHAT = 'CHAT',
  LIVE = 'LIVE'
}

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageSize = "1K" | "2K" | "4K";

export interface ImageGenConfig {
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}

export interface VideoGenConfig {
  aspectRatio: "16:9" | "9:16";
  resolution: "720p" | "1080p";
}
