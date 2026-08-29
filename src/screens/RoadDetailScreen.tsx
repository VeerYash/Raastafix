import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { StatusPill } from '../components/StatusPill';
import { SeverityBadge } from '../components/SeverityBadge';
import { SlaCountdown } from '../components/SlaCountdown';
import { StarRating } from '../components/StarRating';
import { RoadChat } from '../components/RoadChat';
import { VerificationModal } from '../components/VerificationModal';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { formatCoordinates } from '../services/geo';
import {
  MapPin,
  Clock,
  ShieldCheck,
  HardHat,
  ArrowLeft,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  Sparkles,
  Layers,
  Award,
  Info,
  Radio,
  FileText,
} from 'lucide-react';
import { CaseStatus } from '../types/models';

export const RoadDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch, getReportById, getContractorById, getCorporationById } = useApp();

  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const report = getReportById(id || '');

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-[#F5B417] mx-auto animate-bounce" />
        <h2 className="text-xl font-bold text-[#F2EFE8]">
          Road Incident Not Found
        </h2>
        <p className="text-sm text-[#9AA3AD] font-mono">
          The requested defect ID does not exist or may have been consolidated into another sector report.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F5B417] text-[#0C0E11] font-bold font-mono text-xs uppercase shadow-[0_0_12px_rgba(245,180,23,0.3)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Radar</span>
        </Link>
      </div>
    );
  }

  const contractor = report.assignedContractorId
    ? getContractorById(report.assignedContractorId)
    : null;

  const corporation = getCorporationById(report.corporationId);
  const isFixed = report.status === 'fixed';
  const isOfficerOrAuditor =
    state.currentUser.role === 'officer' ||
    state.currentUser.role === 'admin' ||
    state.currentUser.role === 'auditor';

  // Calculate average rating for this specific road
  const averageRoadRating =
    report.ratings.length > 0
      ? report.ratings.reduce((sum, r) => sum + r.stars * r.weight, 0) /
        report.ratings.reduce((sum, r) => sum + r.weight, 0)
      : 0;

  const handleAddRating = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingStars) return;

    dispatch({
      type: 'ADD_RATING',
      payload: {
        reportId: report.id,
        stars: ratingStars,
        comment: ratingComment,
        source: state.currentUser.role === 'citizen' ? 'citizen' : 'review_team',
      },
    });

    setHasRated(true);
    setRatingComment('');
  };

  const handleStatusChange = (newStatus: CaseStatus) => {
    if (newStatus === 'fixed') {
      setVerificationModalOpen(true);
      return;
    }

    dispatch({
      type: 'UPDATE_REPORT_STATUS',
      payload: {
        reportId: report.id,
        status: newStatus,
        note: statusNote || `Status updated by ${state.currentUser.name}`,
      },
    });
    setStatusNote('');
    setIsUpdatingStatus(false);
  };

  const handleAssignContractor = (contractorId: string) => {
    dispatch({
      type: 'ASSIGN_CONTRACTOR',
      payload: {
        reportId: report.id,
        contractorId,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 space-y-6 text-[#F2EFE8]">
      {/* Top Back Navigation & Share */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#9AA3AD] hover:text-[#F5B417] cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; RETURN TO LIVE GRID</span>
        </button>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-[#9AA3AD]">CASE REF:</span>
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#F5B417] font-bold">
            RX-{report.id.replace('rep-', '').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Case Header Hero Banner */}
      <div className="control-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={report.severity} size="md" />
              <StatusPill status={report.status} size="md" />
              <span className="px-2.5 py-0.5 rounded-md bg-[#1B1F26] border border-white/10 text-[10px] font-mono text-[#9AA3AD]">
                WARD {report.ward}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#F2EFE8]">
              {report.roadName}
            </h1>
            <p className="text-xs text-[#9AA3AD] font-mono flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#F5B417]" />
              {report.defectType.toUpperCase()} &bull; Reported near {formatCoordinates(report.location)}
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-[10px] font-mono uppercase text-[#9AA3AD] font-semibold">
              MUNICIPAL RESOLUTION SLA
            </span>
            <SlaCountdown
              slaDueAt={report.slaDueAt}
              status={report.status}
              completedAt={report.completedAt}
              size="lg"
            />
          </div>
        </div>

        {/* Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 font-mono text-xs">
          <div>
            <span className="text-[#9AA3AD] uppercase text-[10px] block">Public Jurisdiction</span>
            <span className="font-bold text-[#F2EFE8]">
              {corporation ? corporation.name : 'Municipal Corporation'}
            </span>
          </div>

          <div>
            <span className="text-[#9AA3AD] uppercase text-[10px] block">GPS Pin Target</span>
            <span className="font-bold text-[#F5B417]">
              {formatCoordinates(report.location)}
            </span>
          </div>

          <div>
            <span className="text-[#9AA3AD] uppercase text-[10px] block">First Telemetry Date</span>
            <span className="font-bold text-[#F2EFE8]">
              {new Date(report.reportedAt).toLocaleDateString()}
            </span>
          </div>

          <div>
            <span className="text-[#9AA3AD] uppercase text-[10px] block">Damage Profile</span>
            <span className="font-bold text-[#2ED3B7] capitalize">
              {report.defectType.replace('_', ' ')} Hazard
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Photos & Timeline, Right Contractor & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Photo Evidence Card with Draggable Seam Slider */}
          <div className="control-panel rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#F2EFE8] flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F5B417]" />
                Visual Damage &amp; Repair Verification
              </span>
              {report.aiConfidence && (
                <span className="text-xs font-mono text-[#2ED3B7] bg-[#2ED3B7]/10 px-2 py-0.5 rounded border border-[#2ED3B7]/30">
                  AI Confidence {(report.aiConfidence * 100).toFixed(0)}%
                </span>
              )}
            </h2>

            {/* Before/After Interactive Comparison */}
            <BeforeAfterSlider
              beforePhoto={report.beforePhoto}
              afterPhoto={report.afterPhoto}
              authenticityScore={report.authenticityScore}
              reporterName={report.reportedByUserName}
              roadName={report.roadName}
            />

            {!report.afterPhoto && (
              <div className="p-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center text-center">
                <ShieldCheck className="w-7 h-7 text-[#9AA3AD] mb-1.5 opacity-60" />
                <span className="text-xs font-semibold text-[#F2EFE8]">
                  Repair Pending Field Completion
                </span>
                <span className="text-[11px] text-[#9AA3AD] font-mono mt-0.5 max-w-[280px]">
                  Contractor crew must upload geo-stamped proof within 25m radius of initial GPS coordinate.
                </span>
                {isOfficerOrAuditor && (
                  <button
                    type="button"
                    onClick={() => setVerificationModalOpen(true)}
                    className="mt-3 px-3.5 py-1.5 rounded-lg bg-[#2ED3B7] hover:bg-[#25b59d] text-[#0C0E11] font-mono text-xs font-bold uppercase cursor-pointer shadow-[0_0_10px_rgba(46,211,183,0.3)]"
                  >
                    Verify &amp; Close Case
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Audit History Timeline */}
          <div className="control-panel rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-[#F2EFE8] flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#F5B417]" />
              Accountability Audit Trail
            </h2>

            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
              {report.history.map((event, idx) => (
                <div key={idx} className="relative">
                  {/* Pin circle */}
                  <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#F5B417] ring-4 ring-[#14171C] shadow-[0_0_8px_#F5B417]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={event.status} size="sm" />
                      <span className="text-xs font-mono text-[#9AA3AD]">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#F2EFE8] mt-1 leading-relaxed font-mono">
                      {event.note}
                    </p>
                    {event.actor && (
                      <span className="text-[10px] font-mono text-[#9AA3AD] block mt-0.5">
                        Officer: {event.actor}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Officer Manual Status Override Controls */}
            {isOfficerOrAuditor && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-[#F5B417]">
                    Municipal Officer Command Override
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsUpdatingStatus(!isUpdatingStatus)}
                    className="text-xs font-mono text-[#9AA3AD] hover:text-[#F2EFE8] underline cursor-pointer"
                  >
                    {isUpdatingStatus ? 'Cancel' : 'Update Status'}
                  </button>
                </div>

                {isUpdatingStatus && (
                  <div className="p-3 bg-[#1B1F26] rounded-xl space-y-2.5 text-xs border border-white/10">
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Add official audit note / dispatch log..."
                      className="w-full bg-[#0C0E11] border border-white/15 rounded-lg p-2 text-xs text-[#F2EFE8] placeholder:text-[#9AA3AD] focus:border-[#F5B417]"
                    />

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleStatusChange('in_progress')}
                        className="px-3 py-1.5 rounded-lg bg-[#F5B417] text-[#0C0E11] font-mono font-bold text-[11px] cursor-pointer"
                      >
                        Set In Progress
                      </button>
                      <button
                        type="button"
                        onClick={() => setVerificationModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-[#2ED3B7] text-[#0C0E11] font-mono font-bold text-[11px] cursor-pointer"
                      >
                        Upload Verified Fix
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange('rejected')}
                        className="px-3 py-1.5 rounded-lg bg-white/10 text-[#F2EFE8] font-mono font-bold text-[11px] cursor-pointer"
                      >
                        Disqualify
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Citizen & Review Team Rating Widget */}
          <div className="control-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#F2EFE8] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#F5B417]" />
                  <span>Dual-Weighted Quality Scoring</span>
                </h2>
                <p className="text-xs text-[#9AA3AD] font-mono mt-0.5">
                  Weighted 60% Citizen Community / 40% Municipal Audit Team.
                </p>
              </div>

              {averageRoadRating > 0 && (
                <StarRating score={averageRoadRating} totalReviews={report.ratings.length} size="md" />
              )}
            </div>

            {/* If fixed, show rating form */}
            {isFixed ? (
              <form onSubmit={handleAddRating} className="p-4 bg-[#1B1F26] rounded-xl space-y-3 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase font-bold text-[#F2EFE8]">
                    Rate Work Quality as {state.currentUser.name}:
                  </span>
                  <StarRating
                    score={ratingStars}
                    interactive={true}
                    onRate={(s) => setRatingStars(s)}
                    size="lg"
                    showNumber={false}
                  />
                </div>

                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Evaluate asphalt compaction, edge sealing, and road drainage (+0.5x weight for detailed notes)..."
                  rows={2}
                  className="w-full bg-[#0C0E11] border border-white/15 rounded-lg p-2.5 text-xs text-[#F2EFE8] placeholder:text-[#9AA3AD] focus:outline-none focus:border-[#F5B417]"
                />

                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1 text-[11px] text-[#9AA3AD]">
                    <Info className="w-3.5 h-3.5 text-[#F5B417]" />
                    <span>
                      {state.currentUser.id === report.reportedByUserId
                        ? 'Original Reporter: 2.5x weight'
                        : state.currentUser.homeWard === report.ward
                        ? 'Ward Resident: 1.5x weight'
                        : 'Standard Citizen Weight'}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#F5B417] hover:bg-[#ffc22e] text-[#0C0E11] font-bold uppercase tracking-wider font-mono text-xs cursor-pointer shadow-[0_0_12px_rgba(245,180,23,0.3)]"
                  >
                    Submit Audit Rating
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 bg-white/[0.03] rounded-xl text-xs text-[#9AA3AD] flex items-center gap-2 font-mono">
                <Clock className="w-4 h-4 text-[#F5B417]" />
                <span>Auditing unlocks once road repair is officially verified fixed.</span>
              </div>
            )}

            {/* List of ratings */}
            {report.ratings.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <span className="text-xs font-mono uppercase text-[#9AA3AD] block">
                  Audited Citizen &amp; Official Reviews ({report.ratings.length})
                </span>
                {report.ratings.map((rat) => (
                  <div
                    key={rat.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F2EFE8]">
                          {rat.userName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-[#9AA3AD] uppercase">
                          {rat.source === 'review_team' ? 'Review Team (40%)' : 'Citizen (60%)'}
                        </span>
                        <span className="text-[10px] font-mono text-[#F5B417] font-bold">
                          {rat.weight}x weight
                        </span>
                      </div>
                      <StarRating score={rat.stars} size="sm" />
                    </div>
                    {rat.comment && (
                      <p className="text-[#9AA3AD] text-xs italic font-mono">
                        &quot;{rat.comment}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Contractor & Chat */}
        <div className="lg:col-span-5 space-y-6">
          {/* Assigned Contractor on the record Card */}
          <div className="control-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-[#F5B417]">
                Liable Contractor on Record
              </span>
              {contractor && (
                <span className="text-xs font-mono text-[#2ED3B7] font-bold">
                  Score: {contractor.overallScore.toFixed(1)}/5.0
                </span>
              )}
            </div>

            {contractor ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-[#F5B417]/15 text-[#F5B417] shrink-0 border border-[#F5B417]/30 shadow-[0_0_12px_rgba(245,180,23,0.15)]">
                    <HardHat className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#F2EFE8] leading-tight">
                      {contractor.name}
                    </h3>
                    <p className="text-xs text-[#9AA3AD] font-mono mt-0.5">
                      Lic: {contractor.licenseNumber} &bull; {contractor.contactEmail}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/10">
                  <div className="p-2.5 rounded-xl bg-[#1B1F26] border border-white/5">
                    <span className="text-[10px] text-[#9AA3AD] block uppercase font-medium">On-Time SLA Honored</span>
                    <span className="font-bold text-[#2ED3B7] text-sm">
                      {contractor.onTimeResolutionPercentage}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1B1F26] border border-white/5">
                    <span className="text-[10px] text-[#9AA3AD] block uppercase font-medium">180d Warranty Re-Fault</span>
                    <span
                      className={`font-bold text-sm ${
                        contractor.reReportRate <= 0.05
                          ? 'text-[#2ED3B7]'
                          : 'text-[#FF4D4D]'
                      }`}
                    >
                      {(contractor.reReportRate * 100).toFixed(1)}% Failure
                    </span>
                  </div>
                </div>

                <Link
                  to={`/contractors/${contractor.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1B1F26] hover:bg-[#252A34] text-[#F5B417] font-mono text-xs font-bold uppercase transition-all border border-white/10 hover:border-[#F5B417]/40 shadow-sm cursor-pointer"
                >
                  <span>View Public Contractor Record</span>
                </Link>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-white/[0.02] text-center space-y-3 border border-white/10">
                <p className="text-xs text-[#9AA3AD] font-mono">
                  No contractor assigned to this road section yet.
                </p>
                {isOfficerOrAuditor && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-[10px] font-mono uppercase text-[#F5B417] text-left font-bold">
                      Assign Municipal Contractor:
                    </label>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => e.target.value && handleAssignContractor(e.target.value)}
                        defaultValue=""
                        className="flex-1 bg-[#0C0E11] border border-white/15 rounded-lg px-3 py-2 text-xs text-[#F2EFE8] font-mono"
                      >
                        <option value="" disabled>
                          Select contractor...
                        </option>
                        {state.contractors.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.overallScore.toFixed(1)}★)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Per-Road Real-time Chat with 120s cooldown */}
          <RoadChat reportId={report.id} chatMessages={report.chat} />
        </div>
      </div>

      {/* Verification Modal for After-Photo */}
      <VerificationModal
        report={report}
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
      />
    </div>
  );
};
