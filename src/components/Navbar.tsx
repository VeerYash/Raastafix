import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { smoothScrollTo } from '../services/scroll';
import {
  Users,
  Check,
  ChevronDown,
  PlusCircle,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { state, dispatch } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const toggleTheme = () => {
    const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
    dispatch({ type: 'SET_THEME', payload: nextTheme });
  };

  const handleNavClick = (anchorId: string, routeFallback?: string) => {
    if (location.pathname === '/') {
      smoothScrollTo(anchorId, 850, 72);
      return;
    }
    if (routeFallback) {
      navigate(routeFallback);
    } else {
      navigate(`/#${anchorId}`);
    }
  };

  return (
    <nav className="nav" id="top">
      <div className="nav-in">
        {/* Brand */}
        <Link to="/" className="brand">
          <span className="pin">
            <span>R</span>
          </span>
          <span className="brand-name">
            Raasta<b>Fix</b>
          </span>
        </Link>

        {/* Center Links */}
        <div className="nav-links">
          <button
            type="button"
            onClick={() => handleNavClick('how')}
            className="cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit"
          >
            How it works
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('features')}
            className="cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit"
          >
            Features
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('trust')}
            className="cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit"
          >
            Trust
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('contractors', '/contractors')}
            className="cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit"
          >
            Contractors
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('api', '/data')}
            className="cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit"
          >
            Open data
          </button>
          <Link
            to="/dashboard"
            className="text-[13px] font-mono text-[var(--signal)] font-semibold"
          >
            Officer Desk
          </Link>
        </div>

        {/* Right Action Controls */}
        <div className="nav-right">
          {/* Persona Switcher for Live Testing */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line-strong)] text-[12px] font-mono text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer transition-colors bg-[var(--surface)]"
              title="Switch simulation role"
            >
              <Users className="w-3.5 h-3.5 text-[var(--hazard-ink)]" />
              <span className="max-w-[85px] truncate font-medium">{state.currentUser.name}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {userDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setUserDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--surface)] border border-[var(--line-strong)] shadow-xl z-50 p-2 space-y-1 text-[var(--ink)]">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--line)] mb-1">
                    <p className="text-[10px] font-mono uppercase tracking-wider text-[var(--ink-faint)] font-semibold">
                      Simulation Personas
                    </p>
                  </div>
                  {state.availableUsers.map((u) => {
                    const isSelected = u.id === state.currentUser.id;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          dispatch({ type: 'SET_CURRENT_USER', payload: u });
                          setUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[var(--surface-2)] font-semibold text-[var(--hazard-ink)]'
                            : 'hover:bg-[var(--surface-2)] text-[var(--ink-soft)]'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-xs text-[var(--ink)]">{u.name}</p>
                          <p className="text-[10px] text-[var(--ink-faint)] font-mono">
                            {u.role.toUpperCase()} &bull; {u.homeWard}
                          </p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[var(--hazard-ink)]" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="toggle"
            id="themeBtn"
            onClick={toggleTheme}
            aria-label="Toggle color theme"
            title="Toggle Light / Dark mode"
          >
            <span id="themeIcon">{state.theme === 'dark' ? '☾' : '☀'}</span>
          </button>

          {/* Report a Road CTA */}
          <Link
            to="/report"
            className="btn btn-primary"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report a road</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};
