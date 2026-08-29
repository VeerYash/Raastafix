import React from 'react';
import { CaseStatus } from '../types/models';
import { CheckCircle2, Clock, Wrench, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';

interface StatusPillProps {
  status: CaseStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const configs: Record<
    CaseStatus,
    { label: string; bg: string; text: string; border: string; glow: string; icon: React.ComponentType<{ className?: string }> }
  > = {
    reported: {
      label: 'Triage Pending',
      bg: 'bg-[#F5B417]/10',
      text: 'text-[#F5B417]',
      border: 'border-[#F5B417]/30',
      glow: 'shadow-[0_0_8px_rgba(245,180,23,0.15)]',
      icon: AlertCircle,
    },
    assigned: {
      label: 'Crew Dispatched',
      bg: 'bg-[#5B6B7A]/15',
      text: 'text-[#F2EFE8]',
      border: 'border-[#5B6B7A]/40',
      glow: 'shadow-none',
      icon: Clock,
    },
    in_progress: {
      label: 'Active Repair',
      bg: 'bg-[#FF8833]/15',
      text: 'text-[#FF8833]',
      border: 'border-[#FF8833]/40',
      glow: 'shadow-[0_0_8px_rgba(255,136,51,0.15)]',
      icon: Wrench,
    },
    verifying: {
      label: 'Audit & GPS Check',
      bg: 'bg-[#2ED3B7]/10',
      text: 'text-[#2ED3B7]',
      border: 'border-[#2ED3B7]/30',
      glow: 'shadow-[0_0_8px_rgba(46,211,183,0.15)]',
      icon: ShieldCheck,
    },
    fixed: {
      label: 'Verified Fixed',
      bg: 'bg-[#2ED3B7]/15',
      text: 'text-[#2ED3B7]',
      border: 'border-[#2ED3B7]/40',
      glow: 'shadow-[0_0_10px_rgba(46,211,183,0.2)]',
      icon: CheckCircle2,
    },
    rejected: {
      label: 'Disqualified',
      bg: 'bg-white/5',
      text: 'text-[#9AA3AD]',
      border: 'border-white/10',
      glow: 'shadow-none',
      icon: XCircle,
    },
  };

  const current = configs[status] || configs.reported;
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'text-[9px] px-2 py-0.5 font-mono font-medium',
    md: 'text-[10px] px-2.5 py-1 font-mono font-medium',
    lg: 'text-xs px-3 py-1 font-mono font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${current.bg} ${current.text} ${current.border} ${current.glow} ${sizeClasses} backdrop-blur-xs`}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{current.label}</span>
    </span>
  );
};
