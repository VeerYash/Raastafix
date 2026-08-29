import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import {
  Trophy,
  ShieldCheck,
  Award,
  ChevronRight,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export const ContractorsLeaderboardScreen: React.FC = () => {
  const { state } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState<string>('all');

  const allWards = Array.from(
    new Set(state.contractors.flatMap((c) => c.operatingWards))
  ).sort();

  const filteredContractors = state.contractors
    .filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesWard =
        selectedWard === 'all' || c.operatingWards.includes(selectedWard);
      return matchesSearch && matchesWard;
    })
    .sort((a, b) => b.overallScore - a.overallScore);

  const getBadgeStyle = (badge: string) => {
    if (badge.includes('favourite') || badge.includes('Champion') || badge.includes('Master')) {
      return 'bg-[#F5B417]/15 text-[#F5B417] border-[#F5B417]/40 shadow-[0_0_8px_rgba(245,180,23,0.15)]';
    }
    if (badge.includes('Review') || badge.includes('Citizen')) {
      return 'bg-[#2ED3B7]/15 text-[#2ED3B7] border-[#2ED3B7]/40 shadow-[0_0_8px_rgba(46,211,183,0.15)]';
    }
    return 'bg-white/5 text-[#9AA3AD] border-white/10';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-[#F2EFE8]">
      {/* Animated Lane Divider */}
      <div className="lane-marking-divider opacity-60" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#F5B417]" />
            <span className="text-xs font-mono uppercase font-bold text-[#F5B417] tracking-wider">
              MUNICIPAL DURABILITY LEADERBOARD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F2EFE8] tracking-tight mt-1">
            Contractor Durability &amp; SLA Standings
          </h1>
          <p className="text-xs font-mono text-[#9AA3AD] mt-1">
            Audited composite formula: <strong className="text-[#F2EFE8]">60% Verified Citizen Audits</strong> + <strong className="text-[#F2EFE8]">40% Municipal Review Team</strong>.
          </p>
        </div>

        {/* SLA policy badge */}
        <div className="p-4 rounded-2xl bg-[#14171C] border border-white/10 text-xs font-mono max-w-sm shadow-xl backdrop-blur-xl">
          <span className="font-bold text-[#2ED3B7] block mb-1 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2ED3B7]" />
            180-Day Warranty Lock SLA
          </span>
          <span className="text-[#9AA3AD] text-[11px] leading-relaxed">
            Defect re-occurrences within 180 days automatically trigger municipal tender demerits and penalty score deductions.
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="control-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#9AA3AD] absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contractor or license #..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#0C0E11] border border-white/15 rounded-xl text-[#F2EFE8] placeholder:text-[#9AA3AD] focus:outline-none focus:border-[#F5B417] font-mono"
            />
          </div>

          {/* Ward filter */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#F5B417]" />
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="bg-[#0C0E11] border border-white/15 rounded-xl px-3 py-2 text-xs text-[#F2EFE8] font-mono focus:border-[#F5B417]"
            >
              <option value="all">All Operational Wards</option>
              {allWards.map((w) => (
                <option key={w} value={w}>
                  Ward: {w}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-mono text-[#F5B417] font-bold">
          {filteredContractors.length} AUDITED CONTRACTORS
        </span>
      </div>

      {/* Leaderboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContractors.map((contractor, index) => {
          const rank = index + 1;
          const rankStr = rank < 10 ? `0${rank}` : `${rank}`;
          const isLeader = rank === 1;
          const barWidth = `${Math.min(100, Math.round((contractor.overallScore / 5) * 100))}%`;

          return (
            <div
              key={contractor.id}
              className={`p-6 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden transition-all control-panel ${
                isLeader
                  ? 'border-[#2ED3B7]/50 shadow-[0_0_30px_rgba(46,211,183,0.15)] ring-1 ring-[#2ED3B7]/30'
                  : ''
              }`}
            >
              {/* Rank & Score Tag */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-extrabold flex items-center justify-center border ${
                      isLeader
                        ? 'bg-[#2ED3B7] text-[#0C0E11] border-[#2ED3B7] shadow-[0_0_12px_#2ED3B7]'
                        : rank === 2
                        ? 'bg-[#F5B417] text-[#0C0E11] border-[#F5B417] shadow-[0_0_10px_#F5B417]'
                        : 'bg-[#1B1F26] text-[#9AA3AD] border-white/10'
                    }`}
                  >
                    #{rankStr}
                  </span>
                  <div>
                    <span className="text-[10px] font-mono text-[#9AA3AD] block">
                      LIC: {contractor.licenseNumber}
                    </span>
                    {isLeader && (
                      <span className="text-[9px] font-mono text-[#2ED3B7] font-bold tracking-wider">
                        WARD LEADER &bull; TOP DURABILITY
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-[#F5B417]">
                    {contractor.overallScore.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#9AA3AD] ml-1 font-mono">/ 5.0</span>
                </div>
              </div>

              {/* Contractor Name & Info */}
              <div>
                <h3 className="font-bold text-base text-[#F2EFE8] group-hover:text-[#F5B417] transition-colors tracking-tight">
                  {contractor.name}
                </h3>
                <p className="text-xs text-[#9AA3AD] font-mono mt-1">
                  Active Wards: {contractor.operatingWards.join(', ')}
                </p>
              </div>

              {/* Glowing Telemetry Score Breakdown */}
              <div className="p-3.5 rounded-xl bg-[#0C0E11] border border-white/10 space-y-2.5 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#9AA3AD]">Citizen Community Score (60%):</span>
                    <span className="font-bold text-[#F2EFE8]">
                      {contractor.citizenScore.toFixed(1)} ★
                    </span>
                  </div>
                  {/* Micro Progress Bar */}
                  <div className="w-full bg-[#1B1F26] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2ED3B7] h-full"
                      style={{ width: `${(contractor.citizenScore / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#9AA3AD]">Municipal Review Team (40%):</span>
                    <span className="font-bold text-[#F2EFE8]">
                      {contractor.reviewTeamScore.toFixed(1)} ★
                    </span>
                  </div>
                  {/* Micro Progress Bar */}
                  <div className="w-full bg-[#1B1F26] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[#F5B417] h-full"
                      style={{ width: `${(contractor.reviewTeamScore / 5) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-center text-[10px]">
                  <div className="p-1.5 rounded bg-white/[0.03]">
                    <span className="text-[#9AA3AD] block uppercase font-mono">On-Time SLA</span>
                    <span className="font-bold text-[#2ED3B7] text-xs">
                      {contractor.onTimeResolutionPercentage}%
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-white/[0.03]">
                    <span className="text-[#9AA3AD] block uppercase font-mono">180d Failure</span>
                    <span
                      className={`font-bold text-xs ${
                        contractor.reReportRate <= 0.05
                          ? 'text-[#2ED3B7]'
                          : 'text-[#FF4D4D]'
                      }`}
                    >
                      {(contractor.reReportRate * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges */}
              {contractor.badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {contractor.badges.map((badge, bIdx) => (
                    <span
                      key={bIdx}
                      className={`text-[9px] font-mono px-2.5 py-0.5 rounded-md border font-bold uppercase ${getBadgeStyle(
                        badge
                      )}`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* CTA Link */}
              <Link
                to={`/contractors/${contractor.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1B1F26] hover:bg-[#252A34] text-[#F5B417] font-mono text-xs font-bold uppercase tracking-wider transition-all border border-white/10 hover:border-[#F5B417]/40 shadow-sm"
              >
                <span>Audit Full Contractor Dossier</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
