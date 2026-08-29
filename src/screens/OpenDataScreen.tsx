import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  Database,
  Code,
  Download,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Terminal,
  FileSpreadsheet,
} from 'lucide-react';

export const OpenDataScreen: React.FC = () => {
  const { state } = useApp();
  const [selectedEndpoint, setSelectedEndpoint] = useState<
    'roads_summary' | 'ward_reports' | 'contractors' | 'durability_audit'
  >('roads_summary');
  const [copied, setCopied] = useState(false);

  // Generate live JSON data dynamically from state
  const getEndpointData = () => {
    switch (selectedEndpoint) {
      case 'roads_summary': {
        const total = state.reports.length;
        const open = state.reports.filter((r) => r.status !== 'fixed' && r.status !== 'rejected').length;
        const fixed = state.reports.filter((r) => r.status === 'fixed').length;
        const critical = state.reports.filter((r) => r.severity === 'critical').length;
        return {
          status: 'success',
          timestamp: new Date().toISOString(),
          data: {
            metrics: {
              totalReportsFiled: total,
              activeHazards: open,
              verifiedRepaired: fixed,
              criticalPotholes: critical,
              citywideOnTimeSlaRate: '94.2%',
            },
            corporations: state.corporations.map((c) => ({
              id: c.id,
              name: c.name,
              shortCode: c.shortCode,
              wardsCovered: c.wards.length,
            })),
          },
        };
      }

      case 'ward_reports': {
        return {
          status: 'success',
          ward: 'Ward 174 (HSR Layout)',
          count: state.reports.filter((r) => r.ward.includes('174')).length,
          reports: state.reports
            .filter((r) => r.ward.includes('174'))
            .map((r) => ({
              caseId: r.id,
              roadName: r.roadName,
              defectType: r.defectType,
              severity: r.severity,
              status: r.status,
              priorityScore: r.priorityScore,
              clusterCount: r.clusterCount,
              location: r.location,
              assignedContractorId: r.assignedContractorId,
              slaDueAt: new Date(r.slaDueAt).toISOString(),
              reportedAt: new Date(r.reportedAt).toISOString(),
            })),
        };
      }

      case 'contractors': {
        return {
          status: 'success',
          totalContractors: state.contractors.length,
          leaderboard: state.contractors.map((c) => ({
            id: c.id,
            name: c.name,
            licenseNumber: c.licenseNumber,
            overallScore: c.overallScore,
            citizenScore: c.citizenScore,
            reviewTeamScore: c.reviewTeamScore,
            onTimeResolutionPercentage: c.onTimeResolutionPercentage,
            reReportRate: c.reReportRate,
            operatingWards: c.operatingWards,
            badges: c.badges,
          })),
        };
      }

      case 'durability_audit': {
        return {
          status: 'success',
          auditWindowDays: 180,
          notes: 'Any defect reported within 35m of a previously fixed road within 180 days triggers contractor penalty.',
          reReportIncidents: state.reports
            .filter((r) => r.clusterCount > 1 || r.status === 'fixed')
            .map((r) => ({
              caseId: r.id,
              roadName: r.roadName,
              ward: r.ward,
              defectType: r.defectType,
              assignedContractorId: r.assignedContractorId,
              completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : null,
              authenticityScore: r.authenticityScore,
            })),
        };
      }
    }
  };

  const jsonString = JSON.stringify(getEndpointData(), null, 2);

  const handleCopy = () => {
    navigator.clipboard?.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raastafix_${selectedEndpoint}_${Date.now()}.json`;
    a.click();
  };

  const handleDownloadCSV = () => {
    // Generate CSV for reports
    const rows = state.reports.map((r) => [
      r.id,
      `"${r.roadName.replace(/"/g, '""')}"`,
      r.ward,
      r.defectType,
      r.severity,
      r.status,
      r.priorityScore,
      r.location.lat,
      r.location.lng,
      new Date(r.reportedAt).toISOString(),
    ]);

    const header = [
      'case_id',
      'road_name',
      'ward',
      'defect_type',
      'severity',
      'status',
      'priority_score',
      'lat',
      'lng',
      'reported_at',
    ];
    const csvContent = [header.join(','), ...rows.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raastafix_open_data_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-mono uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
              Civic Transparency &amp; Open Data
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-display mt-0.5">
            Public Municipal Data API
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Real-time machine-readable feeds for civic researchers, investigative journalists &amp; citizens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700 cursor-pointer flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-mono font-bold uppercase cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Endpoint Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { id: 'roads_summary', label: 'GET /api/v1/roads/summary', name: 'Citywide Summary' },
          { id: 'ward_reports', label: 'GET /api/v1/wards/174/reports', name: 'Ward 174 Grid' },
          { id: 'contractors', label: 'GET /api/v1/contractors/leaderboard', name: 'Contractor Scorecards' },
          { id: 'durability_audit', label: 'GET /api/v1/durability/audit', name: '180d Durability Audit' },
        ].map((ep) => (
          <button
            key={ep.id}
            type="button"
            onClick={() => setSelectedEndpoint(ep.id as any)}
            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
              selectedEndpoint === ep.id
                ? 'bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 border-stone-900 dark:border-amber-500 font-bold shadow-xs'
                : 'bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:bg-stone-50'
            }`}
          >
            <span className="text-[10px] font-mono block opacity-70 truncate">{ep.label}</span>
            <span className="text-xs font-semibold block mt-0.5">{ep.name}</span>
          </button>
        ))}
      </div>

      {/* Interactive JSON Terminal Preview */}
      <div className="rounded-2xl bg-stone-950 border border-stone-800 shadow-xl overflow-hidden font-mono">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-stone-900/90 border-b border-stone-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-teal-500/80" />
            </div>
            <span className="text-stone-400 ml-2 font-bold">
              HTTP 200 OK &bull; content-type: application/json
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-teal-400" />
                <span className="text-teal-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Payload</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <div className="p-4 max-h-[500px] overflow-y-auto text-xs text-amber-300 font-mono-data leading-relaxed selection:bg-amber-500 selection:text-stone-950">
          <pre>{jsonString}</pre>
        </div>
      </div>
    </div>
  );
};
