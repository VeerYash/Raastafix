import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  CaseStatus,
  ChatMessage,
  Contractor,
  Corporation,
  GeoPoint,
  Rating,
  Report,
  User,
  VerificationDetails,
} from '../types/models';
import { storage } from '../data/storage';
import { SEED_USERS } from '../data/seed';
import {
  calculateDistanceMeters,
  resolveJurisdiction,
} from '../services/geo';
import {
  calculateRatingWeight,
  computeContractorScores,
  computePriorityScore,
  findDuplicateCluster,
} from '../services/scoring';

interface AppState {
  reports: Report[];
  contractors: Contractor[];
  corporations: Corporation[];
  currentUser: User;
  availableUsers: User[];
  theme: 'light' | 'dark';
}

type Action =
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_CURRENT_USER'; payload: User }
  | { type: 'CREATE_REPORT'; payload: { report: Report; onMerged?: (targetReportId: string) => void } }
  | { type: 'ASSIGN_CONTRACTOR'; payload: { reportId: string; contractorId: string; note?: string } }
  | { type: 'UPDATE_REPORT_STATUS'; payload: { reportId: string; status: CaseStatus; note: string } }
  | {
      type: 'VERIFY_AND_FIX_REPORT';
      payload: {
        reportId: string;
        afterPhoto: string;
        verificationDetails: VerificationDetails;
        note?: string;
      };
    }
  | {
      type: 'ADD_RATING';
      payload: {
        reportId: string;
        stars: number;
        comment?: string;
        source?: 'citizen' | 'review_team';
      };
    }
  | { type: 'ADD_CHAT_MESSAGE'; payload: { reportId: string; text: string } }
  | { type: 'RESET_DATA' };

const initialStorage = storage.loadState();
const initialTheme = storage.getTheme();

const initialState: AppState = {
  reports: initialStorage.reports,
  contractors: initialStorage.contractors,
  corporations: initialStorage.corporations,
  currentUser: initialStorage.currentUser,
  availableUsers: SEED_USERS,
  theme: initialTheme,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_THEME': {
      storage.setTheme(action.payload);
      return { ...state, theme: action.payload };
    }

    case 'SET_CURRENT_USER': {
      storage.saveCurrentUser(action.payload);
      return { ...state, currentUser: action.payload };
    }

    case 'CREATE_REPORT': {
      const { report } = action.payload;

      // 1. Check for Duplicate Clustering (§7.11)
      const existingCluster = findDuplicateCluster(
        report.location,
        report.defectType,
        state.reports,
        40 // 40m threshold
      );

      let updatedReports: Report[];

      if (existingCluster) {
        // Merge into existing cluster
        const updatedClusterCount = existingCluster.clusterCount + 1;
        const newPriority = computePriorityScore(
          existingCluster.severity,
          existingCluster.roadType,
          existingCluster.trafficLevel,
          updatedClusterCount
        );

        updatedReports = state.reports.map((r) => {
          if (r.id === existingCluster.id) {
            return {
              ...r,
              clusterCount: updatedClusterCount,
              priorityScore: newPriority,
              duplicateMergedReports: [
                ...(r.duplicateMergedReports || []),
                {
                  id: report.id,
                  reportedAt: report.reportedAt,
                  reportedByUserId: report.reportedByUserId,
                  photoUrl: report.beforePhoto,
                },
              ],
              history: [
                ...r.history,
                {
                  status: r.status,
                  timestamp: Date.now(),
                  note: `Duplicate report from ${state.currentUser.name} merged (Total alerts: ${updatedClusterCount}). Priority elevated to ${newPriority}.`,
                  actor: 'RaastaFix AI Sentinel',
                },
              ],
            };
          }
          return r;
        });

        if (action.payload.onMerged) {
          action.payload.onMerged(existingCluster.id);
        }
      } else {
        // Brand new report
        updatedReports = [report, ...state.reports];
      }

      // 2. Durability Check (§7.8)
      // Check if this new report represents a failure of a previously fixed road within 180 days
      let updatedContractors = state.contractors;
      const durabilityWindowMs = 180 * 24 * 60 * 60 * 1000;
      const previouslyFixedReport = state.reports.find(
        (r) =>
          r.status === 'fixed' &&
          r.completedAt &&
          Date.now() - r.completedAt <= durabilityWindowMs &&
          calculateDistanceMeters(r.location, report.location) <= 35
      );

      if (previouslyFixedReport && previouslyFixedReport.assignedContractorId) {
        const contractorId = previouslyFixedReport.assignedContractorId;
        // Recalculate scores with the new failure
        updatedContractors = updatedContractors.map((c) => {
          if (c.id === contractorId) {
            const recomputed = computeContractorScores(c.id, updatedReports);
            return {
              ...c,
              ...recomputed,
            };
          }
          return c;
        });
      }

      storage.saveReports(updatedReports);
      storage.saveContractors(updatedContractors);

      return {
        ...state,
        reports: updatedReports,
        contractors: updatedContractors,
      };
    }

    case 'ASSIGN_CONTRACTOR': {
      const { reportId, contractorId, note } = action.payload;
      const contractor = state.contractors.find((c) => c.id === contractorId);
      const contractorName = contractor ? contractor.name : 'Contractor';

      const updatedReports = state.reports.map((r) => {
        if (r.id === reportId) {
          const newStatus: CaseStatus = 'assigned';
          return {
            ...r,
            status: newStatus,
            assignedContractorId: contractorId,
            history: [
              ...r.history,
              {
                status: newStatus,
                timestamp: Date.now(),
                note: note || `Assigned to ${contractorName}. Work commenced under SLA terms.`,
                actor: state.currentUser.name,
              },
            ],
          };
        }
        return r;
      });

      storage.saveReports(updatedReports);
      return { ...state, reports: updatedReports };
    }

    case 'UPDATE_REPORT_STATUS': {
      const { reportId, status, note } = action.payload;
      const updatedReports = state.reports.map((r) => {
        if (r.id === reportId) {
          const completedAt = status === 'fixed' ? Date.now() : r.completedAt;
          return {
            ...r,
            status,
            completedAt,
            history: [
              ...r.history,
              {
                status,
                timestamp: Date.now(),
                note: note || `Status transitioned to ${status}`,
                actor: state.currentUser.name,
              },
            ],
          };
        }
        return r;
      });

      // Recalculate contractor metrics if fixed
      let updatedContractors = state.contractors;
      const targetReport = updatedReports.find((r) => r.id === reportId);
      if (status === 'fixed' && targetReport?.assignedContractorId) {
        const contractorId = targetReport.assignedContractorId;
        updatedContractors = updatedContractors.map((c) => {
          if (c.id === contractorId) {
            const recomputed = computeContractorScores(c.id, updatedReports);
            return { ...c, ...recomputed };
          }
          return c;
        });
        storage.saveContractors(updatedContractors);
      }

      storage.saveReports(updatedReports);
      return {
        ...state,
        reports: updatedReports,
        contractors: updatedContractors,
      };
    }

    case 'VERIFY_AND_FIX_REPORT': {
      const { reportId, afterPhoto, verificationDetails, note } = action.payload;

      const updatedReports = state.reports.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            status: 'fixed' as CaseStatus,
            afterPhoto,
            completedAt: Date.now(),
            authenticityScore: verificationDetails.authenticityScore,
            authenticityReasons: verificationDetails.authenticityReasons,
            verificationDetails: {
              ...verificationDetails,
              verifiedAt: Date.now(),
              verifiedByActor: state.currentUser.name,
            },
            history: [
              ...r.history,
              {
                status: 'verifying' as CaseStatus,
                timestamp: Date.now() - 1000,
                note: 'Field completion photo uploaded and verified against GPS bounds.',
                actor: state.currentUser.name,
              },
              {
                status: 'fixed' as CaseStatus,
                timestamp: Date.now(),
                note:
                  note ||
                  `Verified fixed by Gemini Sentinel (Authenticity ${Math.round(
                    (verificationDetails.authenticityScore || 0.9) * 100
                  )}%). Case closed.`,
                actor: 'RaastaFix AI Sentinel',
              },
            ],
          };
        }
        return r;
      });

      // Recompute contractor stats
      let updatedContractors = state.contractors;
      const targetReport = updatedReports.find((r) => r.id === reportId);
      if (targetReport?.assignedContractorId) {
        const cid = targetReport.assignedContractorId;
        updatedContractors = updatedContractors.map((c) => {
          if (c.id === cid) {
            const recomputed = computeContractorScores(c.id, updatedReports);
            return { ...c, ...recomputed };
          }
          return c;
        });
        storage.saveContractors(updatedContractors);
      }

      storage.saveReports(updatedReports);
      return {
        ...state,
        reports: updatedReports,
        contractors: updatedContractors,
      };
    }

    case 'ADD_RATING': {
      const { reportId, stars, comment, source } = action.payload;
      const targetReport = state.reports.find((r) => r.id === reportId);
      if (!targetReport) return state;

      const ratingSource = source || (state.currentUser.role === 'citizen' ? 'citizen' : 'review_team');
      const calculatedWeight = calculateRatingWeight(
        state.currentUser,
        targetReport,
        targetReport.ratings,
        !!(comment && comment.trim().length > 0)
      );

      const newRating: Rating = {
        id: `rat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userRole: state.currentUser.role,
        userWard: state.currentUser.homeWard,
        source: ratingSource,
        stars,
        weight: calculatedWeight,
        comment: comment?.trim() || undefined,
        createdAt: Date.now(),
      };

      const updatedReports = state.reports.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            ratings: [...r.ratings, newRating],
          };
        }
        return r;
      });

      // Recalculate contractor scores immediately
      let updatedContractors = state.contractors;
      if (targetReport.assignedContractorId) {
        const cid = targetReport.assignedContractorId;
        updatedContractors = updatedContractors.map((c) => {
          if (c.id === cid) {
            const recomputed = computeContractorScores(c.id, updatedReports);
            return { ...c, ...recomputed };
          }
          return c;
        });
        storage.saveContractors(updatedContractors);
      }

      storage.saveReports(updatedReports);
      return {
        ...state,
        reports: updatedReports,
        contractors: updatedContractors,
      };
    }

    case 'ADD_CHAT_MESSAGE': {
      const { reportId, text } = action.payload;
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        role:
          state.currentUser.role === 'citizen'
            ? 'citizen'
            : state.currentUser.role === 'officer'
            ? 'officer'
            : 'contractor',
        text: text.trim(),
        createdAt: Date.now(),
      };

      const updatedReports = state.reports.map((r) => {
        if (r.id === reportId) {
          return {
            ...r,
            chat: [...r.chat, newMessage],
          };
        }
        return r;
      });

      storage.saveReports(updatedReports);
      return { ...state, reports: updatedReports };
    }

    case 'RESET_DATA': {
      const resetState = storage.resetAll();
      return {
        ...state,
        reports: resetState.reports,
        contractors: resetState.contractors,
        corporations: resetState.corporations,
        currentUser: resetState.currentUser,
      };
    }

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  getReportById: (id: string) => Report | undefined;
  getContractorById: (id: string) => Contractor | undefined;
  getCorporationById: (id: string) => Corporation | undefined;
  getReportsForContractor: (contractorId: string) => Report[];
  getReportsForWard: (ward: string) => Report[];
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Sync theme to DOM on mount
  useEffect(() => {
    storage.setTheme(state.theme);
  }, [state.theme]);

  const getReportById = (id: string) => state.reports.find((r) => r.id === id);
  const getContractorById = (id: string) => state.contractors.find((c) => c.id === id);
  const getCorporationById = (id: string) => state.corporations.find((c) => c.id === id);
  const getReportsForContractor = (contractorId: string) =>
    state.reports.filter((r) => r.assignedContractorId === contractorId);
  const getReportsForWard = (ward: string) => state.reports.filter((r) => r.ward === ward);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        getReportById,
        getContractorById,
        getCorporationById,
        getReportsForContractor,
        getReportsForWard,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
