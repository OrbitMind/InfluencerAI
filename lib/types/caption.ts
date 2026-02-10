export type CaptionAnimation = 'fade-in' | 'slide-up' | 'pop-scale' | 'typewriter' | 'bounce' | 'none';

export type CaptionPosition = 'top' | 'center' | 'bottom';

export type SegmentationMode = 'word' | 'sentence' | 'timed';

export interface CaptionStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor: string;
  backgroundOpacity: number;
  strokeColor: string;
  strokeWidth: number;
  position: CaptionPosition;
  animation: CaptionAnimation;
  animationDuration: number;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  borderRadius: number;
}

export interface CaptionSegment {
  index: number;
  text: string;
  startTime: number;
  endTime: number;
  words?: { text: string; startTime: number; endTime: number }[];
}

export interface CaptionPreset {
  id: string;
  name: string;
  description: string;
  style: CaptionStyle;
  preview: string;
}

export interface SubtitleData {
  segments: CaptionSegment[];
  totalDuration: number;
  segmentationMode: SegmentationMode;
  generatedAt: string;
}

export const DEFAULT_CAPTION_STYLE: CaptionStyle = {
  fontFamily: 'Inter',
  fontSize: 32,
  fontWeight: 700,
  color: '#FFFFFF',
  backgroundColor: '#000000',
  backgroundOpacity: 0.7,
  strokeColor: '#000000',
  strokeWidth: 0,
  position: 'bottom',
  animation: 'fade-in',
  animationDuration: 0.3,
  letterSpacing: 0,
  textTransform: 'none',
  borderRadius: 8,
};

export const CAPTION_PRESETS: CaptionPreset[] = [
  {
    id: 'viral-pop',
    name: 'Viral Pop',
    description: 'Estilo TikTok/Reels com animacao pop',
    preview: '🔥',
    style: {
      fontFamily: 'Inter',
      fontSize: 36,
      fontWeight: 900,
      color: '#FFFFFF',
      backgroundColor: '#FF0050',
      backgroundOpacity: 0.9,
      strokeColor: '#000000',
      strokeWidth: 2,
      position: 'center',
      animation: 'pop-scale',
      animationDuration: 0.3,
      letterSpacing: 1,
      textTransform: 'uppercase',
      borderRadius: 12,
    },
  },
  {
    id: 'elegant-minimal',
    name: 'Elegante Minimal',
    description: 'Clean e sofisticado com fade suave',
    preview: '✨',
    style: {
      fontFamily: 'Georgia',
      fontSize: 28,
      fontWeight: 400,
      color: '#FFFFFF',
      backgroundColor: '#000000',
      backgroundOpacity: 0.5,
      strokeColor: '#000000',
      strokeWidth: 0,
      position: 'bottom',
      animation: 'fade-in',
      animationDuration: 0.5,
      letterSpacing: 2,
      textTransform: 'none',
      borderRadius: 4,
    },
  },
  {
    id: 'bold-impact',
    name: 'Bold Impact',
    description: 'Texto grande e impactante com slide',
    preview: '💥',
    style: {
      fontFamily: 'Arial Black',
      fontSize: 42,
      fontWeight: 900,
      color: '#FFD700',
      backgroundColor: '#000000',
      backgroundOpacity: 0.85,
      strokeColor: '#FF4500',
      strokeWidth: 3,
      position: 'center',
      animation: 'slide-up',
      animationDuration: 0.25,
      letterSpacing: 0,
      textTransform: 'uppercase',
      borderRadius: 0,
    },
  },
  {
    id: 'neon-glow',
    name: 'Neon Glow',
    description: 'Efeito neon vibrante com bounce',
    preview: '💜',
    style: {
      fontFamily: 'Courier New',
      fontSize: 30,
      fontWeight: 700,
      color: '#00FF88',
      backgroundColor: '#1a0033',
      backgroundOpacity: 0.8,
      strokeColor: '#FF00FF',
      strokeWidth: 2,
      position: 'bottom',
      animation: 'bounce',
      animationDuration: 0.4,
      letterSpacing: 1,
      textTransform: 'none',
      borderRadius: 16,
    },
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    description: 'Efeito maquina de escrever retro',
    preview: '⌨️',
    style: {
      fontFamily: 'Courier New',
      fontSize: 26,
      fontWeight: 400,
      color: '#00FF00',
      backgroundColor: '#0D0D0D',
      backgroundOpacity: 0.9,
      strokeColor: '#000000',
      strokeWidth: 0,
      position: 'bottom',
      animation: 'typewriter',
      animationDuration: 0.8,
      letterSpacing: 3,
      textTransform: 'none',
      borderRadius: 0,
    },
  },
  {
    id: 'karaoke',
    name: 'Karaoke',
    description: 'Estilo karaoke com destaque progressivo',
    preview: '🎤',
    style: {
      fontFamily: 'Inter',
      fontSize: 34,
      fontWeight: 800,
      color: '#FFFFFF',
      backgroundColor: '#6C2BD9',
      backgroundOpacity: 0.85,
      strokeColor: '#000000',
      strokeWidth: 1,
      position: 'bottom',
      animation: 'slide-up',
      animationDuration: 0.2,
      letterSpacing: 0,
      textTransform: 'none',
      borderRadius: 24,
    },
  },
];

export const CAPTION_ANIMATIONS: { value: CaptionAnimation; label: string }[] = [
  { value: 'fade-in', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'pop-scale', label: 'Pop Scale' },
  { value: 'typewriter', label: 'Typewriter' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'none', label: 'Nenhuma' },
];

export const CAPTION_FONTS: { value: string; label: string }[] = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Arial Black', label: 'Arial Black' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
  { value: 'Impact', label: 'Impact' },
];

export const SEGMENTATION_MODES: { value: SegmentationMode; label: string; description: string }[] = [
  { value: 'timed', label: 'Temporizado', description: 'Chunks de ~3 palavras com duracao uniforme' },
  { value: 'sentence', label: 'Sentenca', description: 'Divide por pontuacao (frases completas)' },
  { value: 'word', label: 'Palavra', description: 'Uma palavra por vez (estilo karaoke)' },
];
