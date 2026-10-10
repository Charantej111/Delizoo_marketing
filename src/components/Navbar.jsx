import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Receipt,
  FileSpreadsheet,
  Plus,
  Search,
  Users,
  Sun,
  Moon,
  User,
  LogOut,
  Shield,
  ChevronDown,
  Compass
} from 'lucide-react';

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenExpenseModal,
  onOpenTaskModal,
  onOpenPartnerModal,
  onOpenTour,
  searchQuery,
  setSearchQuery,
  expenseCount,
  taskCount,
  partnerCount = 6,
  theme = 'light',
  toggleTheme,
  currentUser,
  onOpenLoginModal,
  onLogout
}) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', href: '/overview', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', href: '/expenses', icon: Receipt, count: expenseCount },
    { id: 'kanban', label: 'Tasks', href: '/tasks', icon: CheckSquare, count: taskCount },
    { id: 'reports', label: 'Reports & Audit', href: '/reports', icon: FileSpreadsheet }
  ];

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || 'P';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15 gap-2 sm:gap-4">
          
          {/* Brand Mark */}
          <a
            href="/overview"
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0 no-underline text-inherit group"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('overview');
            }}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200/80 dark:border-zinc-700/60 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="Delizoo Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold tracking-tight text-zinc-950 dark:text-white">
                  Delizoo OS
                </span>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  Live
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-400 font-medium leading-none hidden xs:block">
                Kakinada Operations
              </p>
            </div>
          </a>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative group">
              <Search className="w-3.5 h-3.5 text-zinc-400 group-focus-within:text-zinc-600 dark:group-focus-within:text-zinc-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor, payer, UTR, task..."
                className="w-full pl-9 pr-14 py-1.5 text-xs bg-zinc-50/80 dark:bg-zinc-900/80 border border-zinc-200/90 dark:border-zinc-800 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 focus:bg-white dark:focus:bg-zinc-900 focus:border-zinc-900/40 dark:focus:border-zinc-600 focus:ring-2 focus:ring-zinc-900/5 dark:focus:ring-white/5 outline-none transition-all"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 pointer-events-none hidden lg:inline-block">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* OS Guide / Tour Button */}
            {onOpenTour && (
              <button
                type="button"
                onClick={onOpenTour}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
                title="What is this for & How to use"
              >
                <Compass className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span className="hidden sm:inline">Guide</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            {toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-600" />
                )}
              </button>
            )}

            {/* Record Expense Button */}
            <button
              onClick={onOpenExpenseModal}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
              <span className="hidden sm:inline">Record Expense</span>
              <span className="sm:hidden">Expense</span>
            </button>

            {/* User Profile / Login Button */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer text-xs shadow-xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-950 font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                    {getInitials(currentUser.name)}
                  </div>
                  <div className="hidden sm:block text-left leading-tight">
                    <div className="font-semibold text-zinc-900 dark:text-white truncate max-w-28 text-xs">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {currentUser.isLead ? 'Lead Founder' : 'Partner'}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-zinc-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl py-2 z-40 text-xs animate-in">
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="font-bold text-zinc-950 dark:text-white text-sm">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono-num truncate mt-0.5">
                        {currentUser.email}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {currentUser.isLead ? <Shield className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <User className="w-3 h-3" />}
                        <span>{currentUser.role || (currentUser.isLead ? 'Founder & Lead' : 'Partner')}</span>
                      </div>
                    </div>

                    <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <div>Assigned Budget: <strong className="text-zinc-900 dark:text-white font-mono-num ml-1">₹{(Number(currentUser.investment) || 0).toLocaleString('en-IN')}</strong></div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      {onOpenPartnerModal && currentUser?.isLead && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onOpenPartnerModal();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
                        >
                          <Users className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Manage Founders ({partnerCount})</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onOpenLoginModal) onOpenLoginModal();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
                      >
                        <User className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Switch Account</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          if (onLogout) onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="/login"
                onClick={(e) => {
                  e.preventDefault();
                  if (onOpenLoginModal) onOpenLoginModal();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-all cursor-pointer no-underline shadow-xs"
              >
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>Sign In</span>
              </a>
            )}
          </div>
        </div>

        {/* Mobile Search Row */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor, payer, UTR..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
              />
            </div>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none border-t border-zinc-100/80 dark:border-zinc-800/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={tab.href}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(tab.id);
                }}
                className={`group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer no-underline ${
                  isActive
                    ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isActive ? 'stroke-[2.2]' : ''}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] font-mono-num font-medium px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-zinc-800 dark:bg-zinc-200 text-zinc-300 dark:text-zinc-700'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
