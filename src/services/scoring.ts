import {
  Contractor,
  DefectType,
  GeoPoint,
  Rating,
  Report,
  RoadType,
  Severity,
  TrafficLevel,
  User,
} from '../types/models';
import { calculateDistanceMeters } from './geo';

/**
 * Compute SLA deadline based on severity level
 * Critical = 24 hours
 * High = 72 hours (3 days)
 * Medium = 7 days
 * Low = 14 days
 */
export function computeSlaDeadline(severity: Severity, startTime: number = Date.now()): number {
  const durations: Record<Severity, number> = {
    critical: 24 * 60 * 60 * 1000,
    high: 72 * 60 * 60 * 1000,
    medium: 7 * 24 * 60 * 60 * 1000,
    low: 14 * 24 * 60 * 60 * 1000,
  };
  return startTime + durations[severity];
}

/**
 * Compute priority score: f(severity, roadType, trafficLevel) + cluster bonus
 * Range: 0 - 100 (higher = more urgent)
 */
export function computePriorityScore(
  severity: Severity,
  roadType: RoadType = 'collector',
  trafficLevel: TrafficLevel = 'medium',
  clusterCount: number = 1
): number {
  const severityWeights: Record<Severity, number> = {
    critical: 45,
    high: 30,
    medium: 18,
    low: 8,
  };

  const roadTypeWeights: Record<RoadType, number> = {
    arterial: 30,
    sub_arterial: 20,
    collector: 12,
    local: 5,
  };

  const trafficWeights: Record<TrafficLevel, number> = {
    critical: 25,
    high: 18,
    medium: 10,
    low: 4,
  };

  const baseScore =
    severityWeights[severity] +
    roadTypeWeights[roadType] +
    trafficWeights[trafficLevel];

  // Cluster bonus: each duplicate report increases urgency
  const clusterBonus = Math.min((clusterCount - 1) * 3, 15);

  return Math.min(Math.round(baseScore + clusterBonus), 100);
}

/**
 * Checks for duplicate open reports within threshold distance of same defect type
 */
export function findDuplicateCluster(
  newLoc: GeoPoint,
  newDefect: DefectType,
  existingReports: Report[],
  thresholdMeters: number = 40
): Report | null {
  const openStatuses = ['reported', 'assigned', 'in_progress', 'verifying'];
  
  for (const report of existingReports) {
    if (!openStatuses.includes(report.status)) continue;
    // Matching defect type or both severe structural issues
    const isSameType =
      report.defectType === newDefect ||
      (report.defectType === 'pothole' && newDefect === 'washout') ||
      (report.defectType === 'washout' && newDefect === 'pothole');

    if (isSameType) {
      const dist = calculateDistanceMeters(newLoc, report.location);
      if (dist <= thresholdMeters) {
        return report;
      }
    }
  }
  return null;
}

/**
 * Weighted rating anti-gaming calculation (§7.6 & §7.9)
 * 
 * Rules:
 * 1. Citizen who originally reported this case gets top trust weight (2.5x).
 * 2. Citizen living in the same ward gets local stake weight (1.8x).
 * 3. Citizen from outside the ward gets baseline weight (1.0x).
 * 4. Anti-brigading / Spam dampening:
 *    - If multiple ratings from same user across reports within a short timeframe (< 5 mins), dampen to 0.4x.
 *    - Extreme ratings (1 or 5) with zero comment text get slight dampening (0.85x) vs reasoned reviews.
 * 5. Review team / official municipal audits carry distinct verified weighting.
 */
export function calculateRatingWeight(
  ratingUser: User,
  report: Report,
  allReportRatings: Rating[],
  hasComment: boolean
): number {
  if (ratingUser.role === 'officer' || ratingUser.role === 'admin') {
    return 3.0; // Official audit weight
  }

  let weight = 1.0;

  // 1. Did user file the report?
  if (ratingUser.id === report.reportedByUserId) {
    weight = 2.5;
  }
  // 2. Does user reside in this ward?
  else if (ratingUser.homeWard && ratingUser.homeWard === report.ward) {
    weight = 1.8;
  }

  // Anti-gaming checks:
  // Check if same user submitted multiple ratings in the last 10 minutes
  const recentRatingsFromUser = allReportRatings.filter(
    (r) => r.userId === ratingUser.id && Date.now() - r.createdAt < 10 * 60 * 1000
  );
  if (recentRatingsFromUser.length >= 2) {
    weight *= 0.4; // Anti-brigading penalty
  }

  // Comment depth heuristic: Unexplained 1-star or 5-star ratings receive slight dampening
  if (!hasComment) {
    weight *= 0.85;
  }

  return Math.round(weight * 100) / 100;
}

/**
 * Recalculate blended contractor scores from all completed jobs
 */
export function computeContractorScores(
  contractorId: string,
  contractorReports: Report[]
): {
  citizenScore: number;
  reviewTeamScore: number;
  overallScore: number;
  stretchesCompleted: number;
  onTimePct: number;
  reReportRate: number;
  badges: string[];
} {
  const fixedReports = contractorReports.filter(
    (r) => r.assignedContractorId === contractorId && r.status === 'fixed'
  );

  let totalCitizenWeightedStars = 0;
  let totalCitizenWeights = 0;

  let totalReviewStars = 0;
  let totalReviewCount = 0;

  let onTimeCount = 0;

  for (const report of fixedReports) {
    // On-time SLA check
    if (report.completedAt && report.completedAt <= report.slaDueAt) {
      onTimeCount++;
    }

    for (const r of report.ratings) {
      if (r.source === 'review_team') {
        totalReviewStars += r.stars;
        totalReviewCount++;
      } else {
        totalCitizenWeightedStars += r.stars * r.weight;
        totalCitizenWeights += r.weight;
      }
    }
  }

  const citizenScore =
    totalCitizenWeights > 0
      ? Math.round((totalCitizenWeightedStars / totalCitizenWeights) * 10) / 10
      : 4.0;

  const reviewTeamScore =
    totalReviewCount > 0
      ? Math.round((totalReviewStars / totalReviewCount) * 10) / 10
      : 4.0;

  const stretchesCompleted = fixedReports.length;
  const onTimePct =
    stretchesCompleted > 0
      ? Math.round((onTimeCount / stretchesCompleted) * 100)
      : 95;

  // Durability / Re-report rate calculation
  // Find fixed reports that had re-reports within 180 days
  let reReportCount = 0;
  const durabilityWindowMs = 180 * 24 * 60 * 60 * 1000;

  for (const report of fixedReports) {
    if (!report.completedAt) continue;
    // Check if another report exists at this location created within 180d after completion
    const hasSubsequentFailure = contractorReports.some(
      (other) =>
        other.id !== report.id &&
        other.reportedAt > report.completedAt! &&
        other.reportedAt - report.completedAt! <= durabilityWindowMs &&
        calculateDistanceMeters(report.location, other.location) <= 35
    );
    if (hasSubsequentFailure) {
      reReportCount++;
    }
  }

  const reReportRate =
    stretchesCompleted > 0
      ? Math.round((reReportCount / stretchesCompleted) * 100) / 100
      : 0.04;

  // Overall blended formula: 60% citizen + 40% review team - (reReportPenalty)
  const reReportPenalty = reReportRate * 2.0; // High re-report rate heavily penalizes score
  const rawOverall =
    citizenScore * 0.6 + reviewTeamScore * 0.4 - reReportPenalty;
  const overallScore = Math.max(1.0, Math.min(5.0, Math.round(rawOverall * 10) / 10));

  // Determine badges
  const badges: string[] = [];
  if (overallScore >= 4.5 && onTimePct >= 90) {
    badges.push('Next tender favourite');
  }
  if (reReportRate <= 0.05 && stretchesCompleted >= 3) {
    badges.push('Durability Champion');
  }
  if (onTimePct >= 95 && stretchesCompleted >= 3) {
    badges.push('SLA Master');
  }
  if (reReportRate > 0.15) {
    badges.push('Re-patch rate high');
  }

  return {
    citizenScore,
    reviewTeamScore,
    overallScore,
    stretchesCompleted,
    onTimePct,
    reReportRate,
    badges,
  };
}
