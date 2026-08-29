import React from 'react';
import { Severity } from '../types/models';

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  showDot = true,
}) => {
  const styles: Record<
    Severity,
    { bg: string; text: string; border: string; dot: string; label: string; glow: string }
  > = {
    critical: {
      bg: 'bg-[#FF4D4D]/15',
      text: 'text-[#FF4D4D]',
      border: 'border-[#FF4D4D]/40',
      dot: 'bg-[#FF4D4D]',
      glow: 'shadow-[0_0_8px_#FF4D4D]',
      label: 'CRITICAL',
    },
    high: {
      bg: 'bg-[#FF8833]/15',
      text: 'text-[#FF8833]',
      border: 'border-[#FF8833]/40',
      dot: 'bg-[#FF8833]',
      glow: 'shadow-[0_0_6px_#FF8833]',
      label: 'HIGH',
    },
    medium: {
      bg: 'bg-[#F5B417]/15',
      text: 'text-[#F5B417]',
      border: 'border-[#F5B417]/40',
      dot: 'bg-[#F5B417]',
      glow: 'shadow-[0_0_6px_#F5B417]',
      label: 'MEDIUM',
    },
    low: {
      bg: 'bg-white/[0.04]',
      text: 'text-[#9AA3AD]',
      border: 'border-white/10',
      dot: 'bg-[#5B6B7A]',
      glow: 'shadow-none',
      label: 'LOW',
    },
  };

  const current = styles[severity] || styles.medium;

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 font-mono font-bold tracking-wider',
    md: 'text-[10px] px-2 py-0.5 font-mono font-bold tracking-wider',
    lg: 'text-[11px] px-2.5 py-1 font-mono font-bold tracking-wider',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${current.bg} ${current.text} ${current.border} ${sizeClasses} uppercase backdrop-blur-xs`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${current.dot} ${current.glow} shrink-0 ${
            severity === 'critical' ? 'animate-pulse' : ''
          }`}
        />
      )}
      {current.label}
    </span>
  );
};
