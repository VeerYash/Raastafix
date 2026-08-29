import React, { useState, useEffect } from 'react';
import { Clock, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { CaseStatus } from '../types/models';

interface SlaCountdownProps {
  slaDueAt: number;
  status: CaseStatus;
  completedAt?: number;
  size?: 'sm' | 'md' | 'lg';
  showRadial?: boolean;
}

export const SlaCountdown: React.FC<SlaCountdownProps> = ({
  slaDueAt,
  status,
  completedAt,
  size = 'md',
  showRadial = true,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const diff = slaDueAt - now;
      setTimeLeft(diff);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [slaDueAt]);

  // If completed, show completion outcome
  if (status === 'fixed' || status === 'rejected') {
    const wasOnTime = completedAt ? completedAt <= slaDueAt : true;
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-mono rounded-md px-2.5 py-0.5 text-[10px] font-semibold border backdrop-blur-xs ${
          wasOnTime
            ? 'bg-[#2ED3B7]/15 text-[#2ED3B7] border-[#2ED3B7]/40 shadow-[0_0_8px_rgba(46,211,183,0.2)]'
            : 'bg-[#F5B417]/15 text-[#F5B417] border-[#F5B417]/40'
        }`}
      >
        <CheckCircle2 className="w-3 h-3 text-current" />
        <span>{wasOnTime ? 'SLA HONORED (ON TIME)' : 'SLA OVERRUN'}</span>
      </span>
    );
  }

  const isOverdue = timeLeft <= 0;
  const absDiff = Math.abs(timeLeft);

  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

  const isUrgent = !isOverdue && timeLeft < 24 * 60 * 60 * 1000;
  const isCriticalUrgent = !isOverdue && timeLeft < 6 * 60 * 60 * 1000;

  // Percentage for radial ring (approximate based on 72h standard SLA)
  const totalSlaMs = 72 * 60 * 60 * 1000;
  const progressRatio = isOverdue ? 1 : Math.max(0, Math.min(1, (totalSlaMs - timeLeft) / totalSlaMs));
  const strokeDashoffset = 44 - 44 * progressRatio;

  return (
    <div
      className={`inline-flex items-center gap-2 font-mono rounded-md px-2.5 py-1 text-[11px] border backdrop-blur-xs ${
        isOverdue
          ? 'bg-[#FF4D4D]/15 text-[#FF4D4D] border-[#FF4D4D]/40 shadow-[0_0_10px_rgba(255,77,77,0.25)] font-bold'
          : isCriticalUrgent
          ? 'bg-[#FF8833]/15 text-[#FF8833] border-[#FF8833]/40 shadow-[0_0_8px_rgba(255,136,51,0.2)] font-bold animate-pulse'
          : isUrgent
          ? 'bg-[#F5B417]/10 text-[#F5B417] border-[#F5B417]/30 font-semibold'
          : 'bg-white/[0.04] text-[#F2EFE8] border-white/10'
      }`}
      title={isOverdue ? 'SLA deadline breached' : 'Time remaining to municipal penalty'}
    >
      {/* Radial Telemetry Ring */}
      {showRadial && (
        <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
          <svg className="w-4 h-4 transform -rotate-90" viewBox="0 0 16 16">
            <circle
              cx="8"
              cy="8"
              r="7"
              className="stroke-white/10"
              strokeWidth="2"
              fill="transparent"
            />
            <circle
              cx="8"
              cy="8"
              r="7"
              className={
                isOverdue
                  ? 'stroke-[#FF4D4D]'
                  : isCriticalUrgent
                  ? 'stroke-[#FF8833]'
                  : isUrgent
                  ? 'stroke-[#F5B417]'
                  : 'stroke-[#2ED3B7]'
              }
              strokeWidth="2"
              strokeDasharray="44"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
        </div>
      )}

      {isOverdue ? (
        <span className="flex items-center gap-1">
          <AlertOctagon className="w-3.5 h-3.5 text-[#FF4D4D] animate-bounce" />
          <span>BREACHED +{hours}h {minutes}m</span>
        </span>
      ) : (
        <span className="flex items-center gap-1">
          <Clock className={`w-3.5 h-3.5 ${isCriticalUrgent ? 'text-[#FF8833]' : 'text-[#F5B417]'}`} />
          <span>{hours}h {minutes}m {seconds}s REMAINING</span>
        </span>
      )}
    </div>
  );
};
