/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './store/AppContext';
import { Navbar } from './components/Navbar';
import { HomeScreen } from './screens/HomeScreen';
import { ReportScreen } from './screens/ReportScreen';
import { RoadDetailScreen } from './screens/RoadDetailScreen';
import { ContractorsLeaderboardScreen } from './screens/ContractorsLeaderboardScreen';
import { ContractorProfileScreen } from './screens/ContractorProfileScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { OpenDataScreen } from './screens/OpenDataScreen';
import { smoothScrollTo } from './services/scroll';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        smoothScrollTo(hash.replace('#', ''), 850, 72);
      }, 50);
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col bg-[var(--ground)] text-[var(--ink)] transition-colors">
          <Navbar />
          <div className="flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/report" element={<ReportScreen />} />
              <Route path="/road/:id" element={<RoadDetailScreen />} />
              <Route path="/contractors" element={<ContractorsLeaderboardScreen />} />
              <Route path="/contractors/:id" element={<ContractorProfileScreen />} />
              <Route path="/dashboard" element={<DashboardScreen />} />
              <Route path="/data" element={<OpenDataScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}
