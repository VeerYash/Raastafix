import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { StatusPill } from '../components/StatusPill';
import { SeverityBadge } from '../components/SeverityBadge';
import { SlaCountdown } from '../components/SlaCountdown';
import { VerificationModal } from '../components/VerificationModal';
import { Link } from 'react-router-dom';
import {
  Building2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Layers,
  ChevronRight,
  UserCheck,
  TrendingUp,
  HardHat,
  Sparkles,
} from 'lucide-react';
import { CaseStatus, Report } from '../types/models';

export const DashboardScreen: React.FC = () => {
  const { state, dispatch, getContractorById } = useApp();

  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeReportForVerification, setActiveReportForVerification] = useState<Report | null>(null);

  const allWards = Array.from(new Set(state.reports.map((r) => r.ward)));

  // Ranked de-duplicated priority queue (§7.11)
  const rankedReports = [...state.reports]
    .filter((r) => {
      if (selectedWard !== 'all' && r.ward !== selectedWard) return false;
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
      return true;
    })
    .sort((a, b) => {
      // Prioritize open non-fixed items first by priorityScore descending
      const aFixed = a.status === 'fixed' || a.status === 'rejected';
      const bFixed = b.status === 'fixed' || b.status === 'rejected';
      if (aFixed && !bFixed) return 1;
      if (!aFixed && bFixed) return -1;
      return (b.priorityScore || 0) - (a.priorityScore || 0);
    });

  // Calculate Metrics
  const totalOpen = state.reports.filter((r) => r.status !== 'fixed' && r.status !== 'rejected').length;
  const criticalHazards = state.reports.filter((r) => r.severity === 'critical' && r.status !== 'fixed').length;
  const overdueBreaches = state.reports.filter(
    (r) => r.status !== 'fixed' && r.status !== 'rejected' && r.slaDueAt < Date.now()
  ).length;
  const urgentWithin6h = state.reports.filter(
    (r) =>
      r.status !== 'fixed' &&
      r.status !== 'rejected' &&
      r.slaDueAt >= Date.now() &&
      r.slaDueAt - Date.now() < 6 * 3600 * 1000
  ).length;

  const handleAssignContractor = (reportId: string, contractorId: string) => {
    dispatch({
      type: 'ASSIGN_CONTRACTOR',
      payload: { reportId, contractorId },
    });
  };

  const handleUpdateStatus = (reportId: string, status: CaseStatus) => {
    dispatch({
      type: 'UPDATE_REPORT_STATUS',
      payload: {
        reportId,
        status,
        note: `Status set to ${status} via Municipal Officer Console`,
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-mono uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
              Municipal Engineering Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-display mt-0.5">
            Jurisdiction Command Console
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Ranked priority queue with multi-alert clustering, SLA clock enforcement &amp; contractor dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono">
            <span className="text-stone-500">Active Officer: </span>
            <strong className="text-stone-900 dark:text-stone-100">
              {state.currentUser.name} ({state.currentUser.role.toUpperCase()})
            </strong>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span>TOTAL OPEN CASES</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black font-mono-data text-stone-900 dark:text-stone-100">
            {totalOpen}
          </div>
          <span className="text-[11px] text-stone-500 font-mono">Across {allWards.length} Wards</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-rose-500">
            <span>CRITICAL (24h SLA)</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black font-mono-data text-rose-600 dark:text-rose-400">
            {criticalHazards}
          </div>
          <span className="text-[11px] text-stone-500 font-mono">High traffic corridors</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-amber-500">
            <span>URGENT / OVERDUE</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black font-mono-data text-amber-600 dark:text-amber-400">
            {overdueBreaches} <span className="text-sm font-normal text-stone-400">breached</span>
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
            {urgentWithin6h} cases &lt; 6h left
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-teal-600 dark:text-teal-400">
            <span>AI VERIFIED CLOSURES</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-3xl font-black font-mono-data text-teal-600 dark:text-teal-400">
            {state.reports.filter((r) => r.status === 'fixed').length}
          </div>
          <span className="text-[11px] text-stone-500 font-mono">100% forensic photo audited</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-800 dark:text-stone-200"
            >
              <option value="all">All Wards</option>
              {allWards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-800 dark:text-stone-200"
            >
              <option value="all">All Statuses</option>
              <option value="reported">Reported (Unassigned)</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="verifying">Verifying Fix</option>
              <option value="fixed">Verified Fixed</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-stone-400">
          Ranked by Multi-Factor Priority Score (Severity × Traffic × Merged Alerts)
        </div>
      </div>

      {/* Ranked Priority Queue Table */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-950/80 border-b border-stone-200 dark:border-stone-800 text-[11px] font-mono uppercase text-stone-500">
              <tr>
                <th className="py-3 px-4">Priority &amp; Case</th>
                <th className="py-3 px-4">Severity / Defect</th>
                <th className="py-3 px-4">Ward &amp; Corridor</th>
                <th className="py-3 px-4">SLA Clock</th>
                <th className="py-3 px-4">Assigned Contractor</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-mono">
              {rankedReports.map((report, idx) => {
                const contractor = report.assignedContractorId
                  ? getContractorById(report.assignedContractorId)
                  : null;

                const isTopPriority = idx < 3 && report.status !== 'fixed';

                return (
                  <tr
                    key={report.id}
                    className={`hover:bg-stone-50/60 dark:hover:bg-stone-800/40 transition-colors ${
                      isTopPriority ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''
                    }`}
                  >
                    {/* Priority & Case ID */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-black px-2 py-0.5 rounded text-xs ${
                            isTopPriority
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div>
                          <Link
                            to={`/road/${report.id}`}
                            className="font-bold text-stone-900 dark:text-stone-100 hover:text-amber-600 block text-xs truncate max-w-[200px]"
                          >
                            {report.roadName}
                          </Link>
                          <span className="text-[10px] text-stone-400">
                            Score: {report.priorityScore || 50} pts
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Severity / Defect */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={report.severity} size="sm" />
                        {report.clusterCount > 1 && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-500/15 px-1.5 py-0.2 rounded border border-rose-500/30">
                            +{report.clusterCount} Alerts
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Ward & Road Type */}
                    <td className="py-3.5 px-4">
                      <div className="text-stone-800 dark:text-stone-200 font-medium">
                        {report.ward}
                      </div>
                      <span className="text-[10px] text-stone-400 uppercase">
                        {report.roadType} &bull; {report.trafficLevel} traffic
                      </span>
                    </td>

                    {/* SLA Clock */}
                    <td className="py-3.5 px-4">
                      <SlaCountdown
                        slaDueAt={report.slaDueAt}
                        status={report.status}
                        completedAt={report.completedAt}
                        size="sm"
                      />
                    </td>

                    {/* Assigned Contractor selector */}
                    <td className="py-3.5 px-4">
                      {report.status === 'fixed' ? (
                        <span className="text-stone-700 dark:text-stone-300 font-semibold">
                          {contractor ? contractor.name : 'Completed'}
                        </span>
                      ) : (
                        <select
                          value={report.assignedContractorId || ''}
                          onChange={(e) => handleAssignContractor(report.id, e.target.value)}
                          className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-800 dark:text-stone-200 max-w-[180px]"
                        >
                          <option value="">-- Assign Contractor --</option>
                          {state.contractors.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.overallScore.toFixed(1)}★)
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {report.status !== 'fixed' && (
                          <button
                            type="button"
                            onClick={() => setActiveReportForVerification(report)}
                            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold uppercase cursor-pointer"
                          >
                            Verify Fix
                          </button>
                        )}
                        <Link
                          to={`/road/${report.id}`}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal if triggered */}
      {activeReportForVerification && (
        <VerificationModal
          report={activeReportForVerification}
          isOpen={true}
          onClose={() => setActiveReportForVerification(null)}
        />
      )}
    </div>
  );
};
