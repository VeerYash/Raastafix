export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type DefectType = 'pothole' | 'crack' | 'rut' | 'washout' | 'edge_break' | 'other';
export type CaseStatus = 'reported' | 'assigned' | 'in_progress' | 'verifying' | 'fixed' | 'rejected';
export type RoadType = 'arterial' | 'sub_arterial' | 'collector' | 'local';
export type TrafficLevel = 'low' | 'medium' | 'high' | 'critical';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Corporation {
  id: string;
  name: string;
  shortCode: string;
  wards: string[];
  bounds: GeoPoint[];
  contactEmail: string;
  emergencyHelpline: string;
  headquarters: string;
}

export interface Contractor {
  id: string;
  name: string;
  corporationId: string;
  stretchesCompleted: number;
  onTimePct: number;
  onTimeResolutionPercentage?: number;
  citizenScore: number; // 0–5, weighted
  reviewTeamScore: number; // 0–5
  overallScore: number; // blended
  reReportRate: number; // durability signal (lower is better, e.g. 0.04)
  badges: string[];
  phone?: string;
  licenseNo?: string;
  licenseNumber?: string;
  contactEmail?: string;
  operatingWards?: string[];
  currentTenders?: string[];
  bio?: string;
}

export interface Rating {
  id: string;
  userId: string;
  userName: string;
  userRole?: 'citizen' | 'officer' | 'admin' | 'auditor';
  userWard?: string;
  source: 'citizen' | 'review_team';
  stars: number;
  weight: number;
  comment?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  role?: 'citizen' | 'contractor' | 'officer';
  text: string;
  createdAt: number;
}

export interface StatusHistoryEntry {
  status: CaseStatus;
  timestamp: number;
  note: string;
  actor: string;
}

export interface VerificationDetails {
  distanceMeters?: number;
  passedGpsProximity?: boolean;
  looksRepaired?: boolean;
  repairConfidence?: number;
  authenticityScore?: number;
  authenticityReasons?: string[];
  sameLocationLikely?: boolean;
  verifiedAt?: number;
  verifiedByActor?: string;
}

export interface Report {
  id: string;
  roadName: string;
  ward: string;
  corporationId: string;
  location: GeoPoint;
  defectType: DefectType;
  severity: Severity;
  aiConfidence: number; // 0–1 from Gemini
  shortDescription?: string;
  beforePhoto: string; // data URL / object URL / base64
  afterPhoto?: string;
  authenticityScore?: number; // 0–1, likelihood photo is a genuine capture
  authenticityReasons?: string[];
  status: CaseStatus;
  reportedByUserId: string;
  reportedByUserName?: string;
  reportedAt: number;
  slaDueAt: number;
  completedAt?: number;
  assignedContractorId?: string;
  clusterCount: number; // how many duplicate reports merged in
  priorityScore: number; // severity × road-type × traffic
  roadType?: RoadType;
  trafficLevel?: TrafficLevel;
  ratings: Rating[];
  chat: ChatMessage[];
  history: StatusHistoryEntry[];
  verificationDetails?: VerificationDetails;
  duplicateMergedReports?: {
    id: string;
    reportedAt: number;
    reportedByUserId: string;
    photoUrl?: string;
  }[];
}

export interface User {
  id: string;
  name: string;
  homeWard: string;
  role: 'citizen' | 'officer' | 'admin' | 'auditor';
  deviceFingerprint?: string;
}

export interface DamageAnalysis {
  defectType: DefectType;
  severity: Severity;
  aiConfidence: number;
  shortDescription: string;
  isRoadImage: boolean;
  rejectionReason?: string;
}

export interface RepairVerification {
  looksRepaired: boolean;
  repairConfidence: number;
  authenticityScore: number;
  authenticityReasons: string[];
  sameLocationLikely: boolean;
}
