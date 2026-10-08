import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Kanban,
  Receipt,
  FileSpreadsheet,
  Plus,
  IndianRupee,
  Search,
  HardDrive,
  X,
  Sun,
  Moon
} from 'lucide-react';

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenExpenseModal,
  onOpenProjectModal,
  searchQuery,
  setSearchQuery,
  expenseCount,
  projectCount,
  taskCount,
  theme = 'light',
  toggleTheme
}) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban, count: projectCount },
    { id: 'kanban', label: 'Tasks', icon: Kanban, count: taskCount },
    { id: 'expenses', label: 'Expense Ledger', icon: Receipt, count: expenseCount },
    { id: 'reports', label: 'Reports & DB', icon: FileSpreadsheet }
  ];

  return (
    <header className="glass-header sticky top-0 z-30 no-print transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0"
            onClick={() => setActiveTab('overview')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 font-extrabold flex items-center justify-center text-sm sm:text-base shadow-sm border border-zinc-800 dark:border-emerald-400">
              D
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white font-sans">
                  DELIZOO
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 hidden xs:inline-block">
                  KKD
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-zinc-500 dark:text-zinc-400 -mt-0.5 hidden sm:block">
                Operations & Expense Ledger
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, vendors, UTR, or payers..."
                className="w-full pl-9 pr-3 py-1.5 text-xs glass-input rounded-xl focus:bg-white dark:focus:bg-zinc-900 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Dark / Light Theme Toggle Button */}
            {toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all shadow-2xs active:scale-95 cursor-pointer"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-emerald-400 hover:rotate-45 transition-transform" />
                ) : (
                  <Moon className="w-4 h-4 text-zinc-700" />
                )}
              </button>
            )}

            {/* Local DB Status Pill (Hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Device DB</span>
            </div>

            {/* New Project Button */}
            <button
              onClick={onOpenProjectModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Project</span>
            </button>

            {/* Log Expense Button */}
            <button
              onClick={onOpenExpenseModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
            >
              <IndianRupee className="w-3.5 h-3.5" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Expandable Bar */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, vendors, UTR..."
                className="w-full pl-9 pr-8 py-2 text-xs glass-input rounded-xl text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
              />
              <button
                onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 dark:text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Frosted Scrollable Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 border-t border-zinc-200/50 dark:border-zinc-800">
        <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto py-1.5 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 py-1.5 px-2.5 sm:px-3 text-xs font-semibold whitespace-nowrap rounded-lg transition-all ${
                  isActive
                    ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono-num font-bold ${
                      isActive
                        ? 'bg-zinc-800 dark:bg-zinc-200 text-zinc-200 dark:text-zinc-800'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
