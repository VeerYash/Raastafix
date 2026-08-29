export interface ColorTokens {
  ground: string;
  tarmac: string;
  panel: string;
  hazard: string;
  teal: string;
  beaconRed: string;
  sheen: string;
  ink: string;
  mutedInk: string;
  hairline: string;
}

export const asphaltNoirTokens: ColorTokens = {
  ground: '#0C0E11', // Wet Asphalt
  tarmac: '#14171C', // Tarmac
  panel: '#1B1F26',  // Raised Slate Panel
  hazard: '#F5B417', // Hazard Amber (road marking yellow)
  teal: '#2ED3B7',   // Signal Teal (verified/fixed)
  beaconRed: '#FF4D4D', // Beacon Red (critical hazard)
  sheen: '#5B6B7A',  // Highway Blue-Grey reflection
  ink: '#F2EFE8',    // Headlight White
  mutedInk: '#9AA3AD',
  hairline: 'rgba(255, 255, 255, 0.08)',
};

export const typography = {
  fontDisplay: "'Bricolage Grotesque', system-ui, -apple-system, sans-serif",
  fontBody: "'Public Sans', system-ui, -apple-system, sans-serif",
  fontMono: "'IBM Plex Mono', monospace",
};

export const severityColors = {
  low: {
    bg: 'bg-white/[0.04]',
    text: 'text-[#9AA3AD]',
    border: 'border-white/10',
    dot: 'bg-[#5B6B7A]',
    badge: 'bg-white/[0.05] text-[#9AA3AD] border-white/10',
    hex: '#5B6B7A',
  },
  medium: {
    bg: 'bg-[#F5B417]/10',
    text: 'text-[#F5B417]',
    border: 'border-[#F5B417]/30',
    dot: 'bg-[#F5B417]',
    badge: 'bg-[#F5B417]/15 text-[#F5B417] border-[#F5B417]/30',
    hex: '#F5B417',
  },
  high: {
    bg: 'bg-[#FF8833]/15',
    text: 'text-[#FF8833]',
    border: 'border-[#FF8833]/30',
    dot: 'bg-[#FF8833]',
    badge: 'bg-[#FF8833]/15 text-[#FF8833] border-[#FF8833]/30',
    hex: '#FF8833',
  },
  critical: {
    bg: 'bg-[#FF4D4D]/15',
    text: 'text-[#FF4D4D]',
    border: 'border-[#FF4D4D]/30',
    dot: 'bg-[#FF4D4D]',
    badge: 'bg-[#FF4D4D]/20 text-[#FF4D4D] border-[#FF4D4D]/40',
    hex: '#FF4D4D',
  },
};
