import React, { useState, useRef, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforePhoto: string;
  afterPhoto?: string;
  authenticityScore?: number;
  reporterName?: string;
  roadName?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforePhoto,
  afterPhoto,
  authenticityScore,
  reporterName,
  roadName,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(percent);
    },
    []
  );

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  if (!afterPhoto) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-[#FF4D4D] flex items-center gap-1.5 uppercase">
            <AlertTriangle className="w-3.5 h-3.5" /> Initial Defect Evidence
          </span>
          <span className="text-[10px] font-mono text-[#9AA3AD]">GPS GROUNDED</span>
        </div>
        <div className="h-64 sm:h-72 rounded-2xl overflow-hidden bg-[#14171C] border border-white/10 relative shadow-2xl">
          <img
            src={beforePhoto}
            alt="Damage evidence"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-3 left-3 bg-[#0C0E11]/90 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-[11px] font-mono text-[#F2EFE8]">
            Reported by {reporterName || 'Citizen Sentinel'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 select-none">
      {/* Header controls & Telemetry Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-[#F5B417] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Interactive Before / After Seam
          </span>
          <span className="text-[10px] font-mono text-[#9AA3AD]">
            (Drag seam to inspect repair)
          </span>
        </div>

        {/* Authentic GPS Stamp */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2ED3B7]/15 border border-[#2ED3B7]/40 text-[#2ED3B7] text-[10px] font-mono font-bold shadow-[0_0_12px_rgba(46,211,183,0.25)]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>✓ AUTHENTIC &bull; SAME GPS RADIUS (25m)</span>
        </div>
      </div>

      {/* Draggable Seam Container */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onTouchMove={handleTouchMove}
        className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-[#14171C] border border-white/15 cursor-ew-resize shadow-2xl"
      >
        {/* Layer 1: After Photo (Full background) */}
        <img
          src={afterPhoto}
          alt="Completed repair"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />

        {/* After Label */}
        <div className="absolute top-3 right-3 z-10 bg-[#0C0E11]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#2ED3B7]/40 text-[#2ED3B7] text-[10px] font-mono font-bold shadow-md">
          FIXED &bull; VERIFIED
        </div>

        {/* Layer 2: Before Photo (Clipped by sliderPos) */}
        <div
          style={{ width: `${sliderPos}%` }}
          className="absolute inset-0 h-full overflow-hidden border-r-2 border-[#F5B417] shadow-[0_0_20px_#F5B417]"
        >
          <img
            src={beforePhoto}
            alt="Initial defect"
            style={{ width: containerRef.current?.offsetWidth || '100%' }}
            className="absolute inset-0 h-full max-w-none object-cover"
            referrerPolicy="no-referrer"
          />
          {/* Before Label */}
          <div className="absolute top-3 left-3 z-10 bg-[#0C0E11]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-[#FF4D4D]/40 text-[#FF4D4D] text-[10px] font-mono font-bold shadow-md">
            BEFORE &bull; INITIAL DEFECT
          </div>
        </div>

        {/* Seam Handle Button */}
        <div
          style={{ left: `${sliderPos}%` }}
          className="absolute top-0 bottom-0 -translate-x-1/2 flex items-center justify-center z-20 pointer-events-none"
        >
          <div className="w-8 h-8 rounded-full bg-[#F5B417] text-[#0C0E11] flex items-center justify-center font-bold text-xs shadow-[0_0_15px_#F5B417] border-2 border-[#0C0E11]">
            <span className="font-mono text-[10px] tracking-tighter">&larr;&rarr;</span>
          </div>
        </div>
      </div>

      {/* Authenticity Grade breakdown */}
      {authenticityScore && (
        <div className="flex items-center justify-between text-xs font-mono bg-[#14171C]/80 px-3.5 py-2 rounded-xl border border-white/5">
          <span className="text-[#9AA3AD]">Multi-Gate AI Vision Alignment Score:</span>
          <span className="text-[#2ED3B7] font-bold">
            {Math.round(authenticityScore * 100)}% Match (Pass Threshold &gt; 85%)
          </span>
        </div>
      )}
    </div>
  );
};
