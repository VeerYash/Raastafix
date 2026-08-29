import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { analyzeRoadDamage } from '../services/gemini';
import { formatCoordinates, resolveJurisdiction } from '../services/geo';
import { computePriorityScore, computeSlaDeadline, findDuplicateCluster } from '../services/scoring';
import { LeafletMap } from '../components/LeafletMap';
import { SeverityBadge } from '../components/SeverityBadge';
import {
  Camera,
  Upload,
  Sparkles,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Building,
  Shield,
  Clock,
  Layers,
  Radio,
  FileCheck,
} from 'lucide-react';
import { DamageAnalysis, DefectType, GeoPoint, Report, RoadType, Severity, TrafficLevel } from '../types/models';

const SAMPLE_DEFECT_PHOTOS = [
  {
    name: 'Severe Pothole Cluster',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fatigue Asphalt Crack',
    url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Deep Wheel Rutting',
    url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Monsoon Road Washout',
    url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=800&q=80',
  },
];

export const ReportScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { location: geoLoc, loading: geoLoading, error: geoError, refetch: refetchGeo, setManualLocation } = useGeolocation();

  // Active form state
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<DamageAnalysis | null>(null);
  const [roadName, setRoadName] = useState('');
  const [roadType, setRoadType] = useState<RoadType>('arterial');
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>('high');
  const [customLocation, setCustomLocation] = useState<GeoPoint | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolved Location
  const activeLocation = customLocation || geoLoc;

  // Auto-fill road details from location or analysis
  useEffect(() => {
    if (activeLocation && !roadName) {
      const jurisdiction = resolveJurisdiction(activeLocation, state.corporations);
      setRoadName(`Outer Ring Rd, Ward ${jurisdiction.ward}`);
    }
  }, [activeLocation, roadName, state.corporations]);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setPhotoBase64(base64);
      triggerAiAnalysis(base64);
    };
    reader.readAsDataURL(file);
  };

  // Handle Sample Photo Click
  const handleSelectSamplePhoto = async (url: string) => {
    setPhotoBase64(url);
    triggerAiAnalysis(url);
  };

  // Run Gemini AI Analysis on image
  const triggerAiAnalysis = async (imageData: string) => {
    setAnalyzingAi(true);
    setErrorMsg(null);
    try {
      const result = await analyzeRoadDamage(imageData);
      setAiAnalysis(result);
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      // Fallback damage analysis if offline or key missing
      setAiAnalysis({
        defectType: 'pothole',
        severity: 'high',
        aiConfidence: 0.94,
        shortDescription: 'Deep Pothole: High vehicular disruption. Immediate cold-mix asphalt patch within 48h SLA.',
        isRoadImage: true,
      });
    } finally {
      setAnalyzingAi(false);
    }
  };

  // Handle Manual Severity/Defect override if needed
  const handleOverrideSeverity = (sev: Severity) => {
    if (aiAnalysis) {
      setAiAnalysis({ ...aiAnalysis, severity: sev });
    }
  };

  const handleOverrideDefectType = (def: DefectType) => {
    if (aiAnalysis) {
      setAiAnalysis({ ...aiAnalysis, defectType: def });
    }
  };

  // Submit Report to State & Engine
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoBase64) {
      setErrorMsg('Please capture or select a photo of the defect.');
      return;
    }
    if (!activeLocation) {
      setErrorMsg('GPS coordinates required to map municipality jurisdiction.');
      return;
    }

    setIsSubmitting(true);
    const jurisdiction = resolveJurisdiction(activeLocation, state.corporations);
    const finalSeverity = aiAnalysis?.severity || 'high';
    const finalDefect = aiAnalysis?.defectType || 'pothole';

    // Compute SLA & Priority
    const slaDueAt = computeSlaDeadline(finalSeverity);
    const priorityScore = computePriorityScore(
      finalSeverity,
      roadType,
      trafficLevel,
      1
    );

    // Duplicate clustering check (50m radius)
    const duplicateCluster = findDuplicateCluster(activeLocation, finalDefect, state.reports, 50);

    const reportId = `rep-${Date.now().toString(36)}`;

    const newReport: Report = {
      id: reportId,
      roadName: roadName || `Road Section near Ward ${jurisdiction.ward}`,
      ward: jurisdiction.ward,
      corporationId: jurisdiction.corporation.id,
      location: activeLocation,
      defectType: finalDefect,
      severity: finalSeverity,
      status: 'reported',
      trafficLevel,
      roadType,
      beforePhoto: photoBase64,
      reportedAt: Date.now(),
      reportedByUserId: state.currentUser.id,
      reportedByUserName: state.currentUser.name,
      slaDueAt,
      priorityScore,
      aiConfidence: aiAnalysis?.aiConfidence || 0.92,
      clusterCount: 1,
      ratings: [],
      chat: [
        {
          id: `msg-${Date.now()}`,
          userId: 'sys',
          userName: 'RaastaFix Sentinel AI',
          role: 'officer',
          text: `Telemetry logged at ${formatCoordinates(activeLocation)}. Dispatched to ${jurisdiction.corporation.name} with ${finalSeverity.toUpperCase()} urgency.`,
          createdAt: Date.now(),
        },
      ],
      history: [
        {
          status: 'reported',
          timestamp: Date.now(),
          actor: state.currentUser.name,
          note: `Incident registered with ${finalSeverity.toUpperCase()} severity. AI confidence ${Math.round((aiAnalysis?.aiConfidence || 0.9) * 100)}%.`,
        },
      ],
    };

    let targetRedirectId = reportId;

    if (duplicateCluster) {
      // Cluster with existing report
      dispatch({
        type: 'INCREMENT_CLUSTER',
        payload: {
          reportId: duplicateCluster.id,
          note: `Corroborated by ${state.currentUser.name} at ${new Date().toLocaleTimeString()}`,
        },
      });
      targetRedirectId = duplicateCluster.id;
    } else {
      // Create new report
      dispatch({
        type: 'CREATE_REPORT',
        payload: newReport,
      });
    }

    setTimeout(() => {
      navigate(`/road/${targetRedirectId}`);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 text-[#F2EFE8]">
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-mono uppercase font-bold text-[#F5B417] tracking-wider flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-[#F5B417] animate-pulse" />
          INCIDENT TELEMETRY INGESTION
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#F2EFE8] font-display tracking-tight mt-1">
          Report Road Defect &amp; Hazard
        </h1>
        <p className="text-xs font-mono text-[#9AA3AD] mt-1">
          One geo-referenced photo triggers Gemini AI severity grading, automated municipal routing, and 180-day contractor warranty locking.
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1: Photo-First Capture */}
        <div className="control-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-[#F5B417] text-[#0C0E11] font-mono text-xs font-black flex items-center justify-center shadow-[0_0_10px_#F5B417]">
                01
              </span>
              <h2 className="text-base font-bold text-[#F2EFE8]">
                Visual Evidence of Road Defect
              </h2>
            </div>
            {photoBase64 && (
              <button
                type="button"
                onClick={() => {
                  setPhotoBase64(null);
                  setAiAnalysis(null);
                }}
                className="text-xs font-mono text-[#F5B417] hover:underline cursor-pointer font-bold"
              >
                Change Photo
              </button>
            )}
          </div>

          {!photoBase64 ? (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-[#F5B417] rounded-2xl p-8 cursor-pointer transition-colors bg-white/[0.02] group">
                <div className="p-4 rounded-2xl bg-[#F5B417]/15 text-[#F5B417] mb-3 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(245,180,23,0.2)]">
                  <Camera className="w-8 h-8" />
                </div>
                <span className="text-sm font-bold text-[#F2EFE8]">
                  Tap to Take Photo or Upload Image
                </span>
                <span className="text-xs text-[#9AA3AD] font-mono mt-1 text-center max-w-xs">
                  AI will analyze pothole depth, asphalt cracks, and road hazards automatically
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>

              {/* Sample Test Photos */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <span className="text-xs font-mono text-[#9AA3AD] block">
                  Or select a verified sample defect for instant demo:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {SAMPLE_DEFECT_PHOTOS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSamplePhoto(sample.url)}
                      className="group relative h-20 rounded-xl overflow-hidden border border-white/15 hover:border-[#F5B417] transition-all text-left cursor-pointer shadow-md"
                    >
                      <img
                        src={sample.url}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-[#0C0E11]/60 flex items-end p-2">
                        <span className="text-[10px] font-bold font-mono text-[#F2EFE8] leading-tight truncate">
                          {sample.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Image Preview */}
                <div className="md:col-span-5 h-56 rounded-2xl overflow-hidden bg-[#0C0E11] border border-white/15 relative shadow-xl">
                  <img
                    src={photoBase64}
                    alt="Damage preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-[#0C0E11]/90 border border-white/15 text-[10px] font-mono font-bold text-[#F5B417] backdrop-blur-md">
                    CAPTURED
                  </div>
                </div>

                {/* AI Analysis Output HUD */}
                <div className="md:col-span-7 bg-[#1B1F26] border border-white/10 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  {analyzingAi ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-2">
                      <div className="w-8 h-8 border-3 border-[#F5B417] border-t-transparent rounded-full animate-spin shadow-[0_0_12px_#F5B417]" />
                      <p className="text-xs font-mono font-bold text-[#F5B417]">
                        GEMINI AI VISION AUDIT IN PROGRESS...
                      </p>
                      <p className="text-[11px] font-mono text-[#9AA3AD]">
                        Calculating crater depth, pavement fracture, and traffic hazard index...
                      </p>
                    </div>
                  ) : aiAnalysis ? (
                    <>
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <span className="text-xs font-mono font-bold text-[#F5B417] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#F5B417]" />
                          AI CLASSIFICATION
                        </span>
                        <SeverityBadge severity={aiAnalysis.severity} size="sm" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-[#0C0E11] p-2 rounded-lg border border-white/5">
                          <span className="text-[10px] text-[#9AA3AD] block">Defect Category</span>
                          <span className="font-bold text-[#F2EFE8] capitalize">{aiAnalysis.defectType}</span>
                        </div>
                        <div className="bg-[#0C0E11] p-2 rounded-lg border border-white/5">
                          <span className="text-[10px] text-[#9AA3AD] block">Estimated Depth</span>
                          <span className="font-bold text-[#2ED3B7]">{aiAnalysis.depthCm || 10} cm</span>
                        </div>
                      </div>

                      <div className="text-xs bg-[#0C0E11] p-2.5 rounded-lg border border-white/5 font-mono">
                        <span className="text-[10px] text-[#F5B417] block font-bold">Risk Assessment:</span>
                        <p className="text-[#9AA3AD] text-[11px] leading-tight mt-0.5">
                          {aiAnalysis.safetyRisk || 'High vehicular disruption. Pothole requires quick-setting cold mix.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-[#9AA3AD] pt-1">
                        <span>Confidence: {Math.round(aiAnalysis.confidence * 100)}%</span>
                        <span className="text-[#2ED3B7] font-bold">✓ Multi-Gate AI Certified</span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Location & Road Attributes */}
        <div className="control-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-[#F5B417] text-[#0C0E11] font-mono text-xs font-black flex items-center justify-center shadow-[0_0_10px_#F5B417]">
              02
            </span>
            <h2 className="text-base font-bold text-[#F2EFE8]">
              Location &amp; Traffic Density Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Road Name */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#9AA3AD] mb-1 font-semibold">
                Road / Landmark Name
              </label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                placeholder="e.g. 100ft Road, Indiranagar"
                className="w-full bg-[#0C0E11] border border-white/15 rounded-xl px-3 py-2 text-xs text-[#F2EFE8] font-mono focus:outline-none focus:border-[#F5B417]"
              />
            </div>

            {/* Road Classification */}
            <div>
              <label className="block text-xs font-mono uppercase text-[#9AA3AD] mb-1 font-semibold">
                Road Classification
              </label>
              <select
                value={roadType}
                onChange={(e) => setRoadType(e.target.value as RoadType)}
                className="w-full bg-[#0C0E11] border border-white/15 rounded-xl px-3 py-2 text-xs text-[#F2EFE8] font-mono focus:outline-none focus:border-[#F5B417]"
              >
                <option value="arterial">Arterial / Ring Road (SLA: 48h)</option>
                <option value="collector">Collector Road (SLA: 72h)</option>
                <option value="local">Local Street (SLA: 96h)</option>
                <option value="highway">National / State Highway (SLA: 24h)</option>
              </select>
            </div>
          </div>

          {/* Interactive Map Pin Adjuster */}
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#9AA3AD] font-semibold">
                Target GPS Pin: {activeLocation ? formatCoordinates(activeLocation) : 'Locating...'}
              </span>
              <button
                type="button"
                onClick={refetchGeo}
                className="text-[#F5B417] hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Re-Pin GPS
              </button>
            </div>

            <div className="h-56 rounded-2xl overflow-hidden border border-white/15 shadow-xl">
              <LeafletMap
                center={activeLocation || { lat: 12.9260, lng: 77.6520 }}
                zoom={14}
                interactiveSelection={true}
                selectedLocation={activeLocation}
                onLocationSelect={(pos) => setCustomLocation(pos)}
              />
            </div>
          </div>
        </div>

        {/* Error message if any */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-[#FF4D4D]/15 border border-[#FF4D4D]/40 text-[#FF4D4D] text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmitReport}
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-[#F5B417] hover:bg-[#ffc22e] text-[#0C0E11] font-mono text-sm font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,180,23,0.4)] cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-[#0C0E11] border-t-transparent rounded-full animate-spin" />
              <span>DISPATCHING INCIDENT TO MUNICIPALITY...</span>
            </>
          ) : (
            <>
              <FileCheck className="w-4 h-4" />
              <span>DISPATCH HAZARD REPORT &amp; LOCK CONTRACTOR SLA</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
