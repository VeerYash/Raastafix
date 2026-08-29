import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { StarRating } from '../components/StarRating';
import { StatusPill } from '../components/StatusPill';
import { SeverityBadge } from '../components/SeverityBadge';
import { SlaCountdown } from '../components/SlaCountdown';
import {
  HardHat,
  ArrowLeft,
  Award,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Building,
  Mail,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const ContractorProfileScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, getContractorById, getReportsForContractor } = useApp();

  const contractor = getContractorById(id || '');

  if (!contractor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4 text-[#F2EFE8]">
        <AlertTriangle className="w-12 h-12 text-[#F5B417] mx-auto" />
        <h2 className="text-xl font-bold text-[#F2EFE8]">
          Contractor Dossier Not Found
        </h2>
        <Link
          to="/contractors"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5B417] text-[#0C0E11] font-bold font-mono text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Leaderboard</span>
        </Link>
      </div>
    );
  }

  const reports = getReportsForContractor(contractor.id);
  const completedReports = reports.filter((r) => r.status === 'fixed');
  const activeReports = reports.filter((r) => r.status !== 'fixed' && r.status !== 'rejected');
  const rankIndex = state.contractors.findIndex((c) => c.id === contractor.id) + 1;
  const isLeader = rankIndex === 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-6 text-[#F2EFE8]">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/contractors')}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#9AA3AD] hover:text-[#F5B417] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; BACK TO PUBLIC LEADERBOARD</span>
        </button>
      </div>

      {/* Profile Header Card */}
      <div
        className={`control-panel rounded-2xl p-6 sm:p-8 space-y-6 ${
          isLeader ? 'border-[#2ED3B7]/40 shadow-[0_0_30px_rgba(46,211,183,0.12)]' : ''
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-[#F5B417]/15 text-[#F5B417] shrink-0 border border-[#F5B417]/30 shadow-[0_0_15px_rgba(245,180,23,0.2)]">
              <HardHat className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F2EFE8] font-display">
                  {contractor.name}
                </h1>
                {contractor.badges?.map((badge, bIdx) => (
                  <span
                    key={bIdx}
                    className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-[#F5B417]/15 text-[#F5B417] border border-[#F5B417]/30"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <p className="text-xs font-mono text-[#9AA3AD] mt-1">
                License: {contractor.licenseNumber} &bull; Contact: {contractor.contactEmail}
              </p>

              <p className="text-xs text-[#9AA3AD] font-mono mt-2">
                Authorized Wards: <strong className="text-[#F2EFE8]">{contractor.operatingWards.join(', ')}</strong>
              </p>
            </div>
          </div>

          {/* Overall Rating Block */}
          <div className="p-5 rounded-2xl bg-[#0C0E11] border border-white/10 flex flex-col items-center justify-center min-w-[190px] text-center shadow-xl">
            <span className="text-[10px] font-mono uppercase text-[#9AA3AD] font-bold">
              Accountability Score
            </span>
            <div className="text-3xl font-black font-mono-data text-[#F5B417] mt-1">
              {contractor.overallScore.toFixed(1)}
              <span className="text-sm text-[#9AA3AD]">/5.0</span>
            </div>
            <StarRating score={contractor.overallScore} size="sm" showNumber={false} />
            <span className="text-[10px] text-[#2ED3B7] font-mono font-bold mt-1">
              Ranked #{rankIndex} Citywide Durability
            </span>
          </div>
        </div>

        {/* 3-Pillar Durability & Metric Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
          <div className="p-4 rounded-xl bg-[#0C0E11] border border-white/10 space-y-1">
            <span className="text-xs font-mono uppercase font-bold text-[#F5B417] flex items-center justify-between">
              <span>Citizen Score (60%)</span>
              <span>{contractor.citizenScore.toFixed(1)} ★</span>
            </span>
            <p className="text-xs text-[#9AA3AD] font-mono leading-snug">
              Weighted by verified reporters and geo-fenced local ward residents.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0C0E11] border border-white/10 space-y-1">
            <span className="text-xs font-mono uppercase font-bold text-[#2ED3B7] flex items-center justify-between">
              <span>Review Team (40%)</span>
              <span>{contractor.reviewTeamScore.toFixed(1)} ★</span>
            </span>
            <p className="text-xs text-[#9AA3AD] font-mono leading-snug">
              Audited by municipal engineering officers and AI edge inspection.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0C0E11] border border-white/10 space-y-1">
            <span className="text-xs font-mono uppercase font-bold text-[#F2EFE8] flex items-center justify-between">
              <span>180-Day Warranty Fault</span>
              <span className={contractor.reReportRate <= 0.05 ? 'text-[#2ED3B7]' : 'text-[#FF4D4D]'}>
                {(contractor.reReportRate * 100).toFixed(1)}% Failure
              </span>
            </span>
            <p className="text-xs text-[#9AA3AD] font-mono leading-snug">
              Potholes re-reported within 6 months trigger penalty points.
            </p>
          </div>
        </div>
      </div>

      {/* Assigned Road Work Orders List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#F2EFE8] flex items-center justify-between">
          <span>Active &amp; Historical Work Orders ({reports.length})</span>
          <span className="text-xs font-mono text-[#9AA3AD]">
            {completedReports.length} fixed &bull; {activeReports.length} in progress
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <Link
              key={report.id}
              to={`/road/${report.id}`}
              className="control-panel p-4 rounded-2xl flex flex-col justify-between space-y-3 group hover:border-[#F5B417]/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={report.severity} size="sm" />
                  <StatusPill status={report.status} size="sm" />
                </div>
                <span className="text-[10px] font-mono text-[#9AA3AD]">
                  Ward {report.ward}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-[#F2EFE8] group-hover:text-[#F5B417] transition-colors line-clamp-1">
                  {report.roadName}
                </h3>
                <p className="text-xs font-mono text-[#9AA3AD] mt-0.5">
                  Reported: {new Date(report.reportedAt).toLocaleDateString()}
                </p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <SlaCountdown
                  slaDueAt={report.slaDueAt}
                  status={report.status}
                  completedAt={report.completedAt}
                  size="sm"
                />
                <span className="text-[#F5B417] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
