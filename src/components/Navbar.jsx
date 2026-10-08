import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Receipt,
  FileSpreadsheet,
  Plus,
  Search,
  Users,
  Sun,
  Moon
} from 'lucide-react';

export function Navbar({
  activeTab,
  setActiveTab,
  onOpenExpenseModal,
  onOpenPartnerModal,
  searchQuery,
  setSearchQuery,
  expenseCount,
  taskCount,
  partnerCount = 6,
  theme = 'light',
  toggleTheme
}) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expense Ledger', icon: Receipt, count: expenseCount },
    { id: 'kanban', label: 'Milestones & Tasks', icon: CheckSquare, count: taskCount },
    { id: 'reports', label: 'Reports & Audit', icon: FileSpreadsheet }
  ];

  return (
    <header className="glass-header sticky top-0 z-30 no-print transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3 sm:gap-4">
          
          {/* Brand Logo & Title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
            onClick={() => setActiveTab('overview')}
          >
            <div className="w-8 h-8 rounded-xl bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 font-black flex items-center justify-center text-sm shadow-sm">
              D
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-zinc-900 dark:text-white">
                  DELIZOO
                </span>
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  Kakinada
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor, payer, UTR, or notes..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs glass-input rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons & Controls */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Dark / Light Theme Toggle */}
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

            {/* Founders Pool Button */}
            {onOpenPartnerModal && (
              <button
                onClick={onOpenPartnerModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer shadow-2xs"
                title="Manage Founders Capital Pool"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Founders ({partnerCount})</span>
              </button>
            )}

            {/* Log Expense Button */}
            <button
              onClick={onOpenExpenseModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3 pt-1">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor, payer, UTR..."
                className="w-full pl-8.5 pr-3 py-1.5 text-xs glass-input rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1.5 scrollbar-none border-t border-zinc-200/60 dark:border-zinc-800/80">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 font-bold shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-zinc-800/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`text-[10px] font-mono-num font-bold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/20 dark:bg-zinc-900/30 text-white dark:text-zinc-950'
                        : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
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
