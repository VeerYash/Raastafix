import {
  Contractor,
  Corporation,
  Report,
  User,
} from '../types/models';
import {
  SEED_CONTRACTORS,
  SEED_CORPORATIONS,
  SEED_REPORTS,
  SEED_USERS,
} from './seed';

const STORAGE_KEYS = {
  REPORTS: 'raastafix_reports_v1',
  CONTRACTORS: 'raastafix_contractors_v1',
  CORPORATIONS: 'raastafix_corporations_v1',
  CURRENT_USER: 'raastafix_current_user_v1',
  THEME: 'raastafix_theme_v1',
  CHAT_COOLDOWNS: 'raastafix_chat_cooldowns_v1',
};

export interface AppStorageState {
  reports: Report[];
  contractors: Contractor[];
  corporations: Corporation[];
  currentUser: User;
}

export const storage = {
  getTheme(): 'light' | 'dark' {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  },

  setTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
      document.documentElement.setAttribute('data-theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.warn('Failed to set theme in localStorage', e);
    }
  },

  loadState(): AppStorageState {
    try {
      const storedReports = localStorage.getItem(STORAGE_KEYS.REPORTS);
      const storedContractors = localStorage.getItem(STORAGE_KEYS.CONTRACTORS);
      const storedCorporations = localStorage.getItem(STORAGE_KEYS.CORPORATIONS);
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

      const reports: Report[] = storedReports ? JSON.parse(storedReports) : SEED_REPORTS;
      const contractors: Contractor[] = storedContractors ? JSON.parse(storedContractors) : SEED_CONTRACTORS;
      const corporations: Corporation[] = storedCorporations ? JSON.parse(storedCorporations) : SEED_CORPORATIONS;
      const currentUser: User = storedUser ? JSON.parse(storedUser) : SEED_USERS[0];

      return {
        reports,
        contractors,
        corporations,
        currentUser,
      };
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      return {
        reports: SEED_REPORTS,
        contractors: SEED_CONTRACTORS,
        corporations: SEED_CORPORATIONS,
        currentUser: SEED_USERS[0],
      };
    }
  },

  saveReports(reports: Report[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save reports to storage', e);
    }
  },

  saveContractors(contractors: Contractor[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTRACTORS, JSON.stringify(contractors));
    } catch (e) {
      console.error('Failed to save contractors to storage', e);
    }
  },

  saveCorporations(corporations: Corporation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CORPORATIONS, JSON.stringify(corporations));
    } catch (e) {
      console.error('Failed to save corporations to storage', e);
    }
  },

  saveCurrentUser(user: User): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (e) {
      console.error('Failed to save current user to storage', e);
    }
  },

  resetAll(): AppStorageState {
    try {
      localStorage.removeItem(STORAGE_KEYS.REPORTS);
      localStorage.removeItem(STORAGE_KEYS.CONTRACTORS);
      localStorage.removeItem(STORAGE_KEYS.CORPORATIONS);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.CHAT_COOLDOWNS);
    } catch (e) {
      console.warn('Error clearing localStorage', e);
    }
    return {
      reports: SEED_REPORTS,
      contractors: SEED_CONTRACTORS,
      corporations: SEED_CORPORATIONS,
      currentUser: SEED_USERS[0],
    };
  },
};
