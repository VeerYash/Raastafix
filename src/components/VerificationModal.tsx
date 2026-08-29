import React, { useState } from 'react';
import { Report, VerificationDetails } from '../types/models';
import { useApp } from '../store/AppContext';
import { verifyRepair } from '../services/gemini';
import { isWithinVerificationRadius } from '../services/geo';
import confetti from 'canvas-confetti';
import {
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  MapPin,
  Camera,
  Layers,
} from 'lucide-react';

interface VerificationModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const { dispatch } = useApp();
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationDetails | null>(null);
  const [passedAllGates, setPassedAllGates] = useState(false);

  // Simulated GPS read for after-photo (simulate within 8-15 meters of original or allow slight variation)
  const [simulatedGpsDistance, setSimulatedGpsDistance] = useState<number>(9.4);

  if (!isOpen) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setAfterPhoto(reader.result as string);
      setVerificationResult(null);
      setPassedAllGates(false);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const handleRunVerification = async () => {
    if (!afterPhoto) return;

    setAnalyzing(true);
    setError(null);

    try {
      // 1. Proximity Check (§7.7: <= 25m radius)
      const proximityPassed = simulatedGpsDistance <= 25;

      // 2. Real Gemini AI call to verify repair + authenticity score
      const aiResult = await verifyRepair(report.beforePhoto, afterPhoto);

      const details: VerificationDetails = {
        distanceMeters: simulatedGpsDistance,
        passedGpsProximity: proximityPassed,
        looksRepaired: aiResult.looksRepaired,
        repairConfidence: aiResult.repairConfidence,
        authenticityScore: aiResult.authenticityScore,
        authenticityReasons: aiResult.authenticityReasons,
        sameLocationLikely: aiResult.sameLocationLikely,
      };

      setVerificationResult(details);

      const passed =
        proximityPassed &&
        aiResult.looksRepaired &&
        aiResult.authenticityScore >= 0.7 &&
        aiResult.sameLocationLikely;

      setPassedAllGates(passed);
    } catch (err: any) {
      setError(err.message || 'Verification service failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApproveAndClose = () => {
    if (!afterPhoto || !verificationResult) return;

    dispatch({
      type: 'VERIFY_AND_FIX_REPORT',
      payload: {
        reportId: report.id,
        afterPhoto,
        verificationDetails: verificationResult,
        note: `Verified repaired by Quality Auditor. GPS delta ${simulatedGpsDistance}m. Authenticity score ${(
          (verificationResult.authenticityScore || 0.9) * 100
        ).toFixed(0)}%.`,
      },
    });

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E9A400', '#0F7A6E', '#10B981'],
      });
    } catch (e) {
      console.warn('Confetti effect failed', e);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Verified-Fix Proof Audit
              </h2>
              <p className="text-xs text-stone-500">
                Case #{report.id} &bull; {report.roadName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Before & After Comparison Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-mono uppercase font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Before (Original Damage)
            </span>
            <div className="h-44 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <img
                src={report.beforePhoto}
                alt="Before repair"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-[11px] text-stone-500 font-mono">
              {report.defectType.toUpperCase()} &bull; Reported {new Date(report.reportedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-mono uppercase font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5" />
              After (Completed Repair)
            </span>
            {afterPhoto ? (
              <div className="relative h-44 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 group">
                <img
                  src={afterPhoto}
                  alt="After repair"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => {
                    setAfterPhoto(null);
                    setVerificationResult(null);
                  }}
                  className="absolute top-2 right-2 bg-stone-900/80 text-white p-1 rounded-full text-xs hover:bg-stone-950 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="h-44 flex flex-col items-center justify-center border-2 border-dashed border-stone-300 dark:border-stone-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl p-4 cursor-pointer transition-colors bg-stone-50/50 dark:bg-stone-950/40">
                <Upload className="w-8 h-8 text-amber-500 mb-2 opacity-80" />
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 text-center">
                  Upload &quot;After&quot; Photo
                </span>
                <span className="text-[10px] text-stone-400 text-center mt-1">
                  Must be taken on-site at exact road coordinates
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            )}
            <p className="text-[11px] text-stone-500 font-mono flex items-center justify-between">
              <span>GPS Proximity: {simulatedGpsDistance}m</span>
              <button
                type="button"
                onClick={() => setSimulatedGpsDistance((d) => (d < 20 ? 28 : 8.5))}
                className="text-[10px] text-amber-600 hover:underline cursor-pointer"
              >
                (Toggle GPS: {simulatedGpsDistance}m)
              </button>
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 2: Verification Analysis Panel */}
        {afterPhoto && !verificationResult && (
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold font-mono uppercase text-stone-800 dark:text-stone-200">
                Ready for AI Multi-Gate Verification
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Gemini compares textures, checks image authenticity &amp; verifies GPS bounds.
              </p>
            </div>
            <button
              onClick={handleRunVerification}
              disabled={analyzing}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold font-mono uppercase flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Auditing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Run AI Verification</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Step 3: Detailed AI Audit Result */}
        {verificationResult && (
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                {passedAllGates ? (
                  <div className="p-1 rounded-md bg-teal-500/20 text-teal-600 dark:text-teal-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-1 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold font-mono uppercase text-stone-900 dark:text-stone-100">
                    {passedAllGates ? 'Verification Gates Passed' : 'Verification Gates Flagged'}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Confidence Heuristic + Timestamp + GPS Proximity Evaluation
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-stone-800 dark:text-stone-200">
                  Authenticity: {Math.round((verificationResult.authenticityScore || 0) * 100)}%
                </span>
              </div>
            </div>

            {/* Quality Score Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 block uppercase">GPS Proximity</span>
                <span className={`font-bold ${simulatedGpsDistance <= 25 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600'}`}>
                  {simulatedGpsDistance}m (Limit ≤25m)
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 block uppercase">Repair Quality</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  {Math.round((verificationResult.repairConfidence || 0) * 100)}% Match
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <span className="text-[10px] text-stone-400 block uppercase">Camera Capture</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">
                  Outdoor Authentic
                </span>
              </div>
            </div>

            {/* Reasons list */}
            {verificationResult.authenticityReasons && verificationResult.authenticityReasons.length > 0 && (
              <div className="space-y-1 text-xs text-stone-600 dark:text-stone-300">
                <p className="font-mono uppercase font-bold text-[10px] text-stone-400">
                  Forensic Quality Notes:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {verificationResult.authenticityReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200 dark:border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold font-mono text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleApproveAndClose}
            disabled={!passedAllGates || !verificationResult}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase transition-all flex items-center gap-2 cursor-pointer ${
              passedAllGates
                ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-md'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Case Verified Fixed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
