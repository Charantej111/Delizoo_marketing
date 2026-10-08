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
  X
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
  taskCount
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-900 text-white font-extrabold flex items-center justify-center text-sm sm:text-base shadow-sm border border-slate-800">
              D
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 font-sans">
                  DELIZOO
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 hidden xs:inline-block">
                  KKD
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-500 -mt-0.5 hidden sm:block">
                Operations & Expense Ledger
              </p>
            </div>
          </div>

          {/* Desktop Search Bar */}
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, vendors, UTR, or payers..."
                className="w-full pl-9 pr-3 py-1.5 text-xs glass-input rounded-xl focus:bg-white text-slate-800 placeholder-slate-400 outline-none"
              />
            </div>
          </div>

          {/* Action Buttons & Mobile Search Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Local DB Status Pill (Hidden on mobile) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/60 text-[11px] font-semibold text-slate-600">
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>Device DB</span>
            </div>

            {/* New Project Button */}
            <button
              onClick={onOpenProjectModal}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold transition-all shadow-2xs hover:border-slate-300"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Project</span>
            </button>

            {/* Log Expense Button */}
            <button
              onClick={onOpenExpenseModal}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
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
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, vendors, UTR..."
                className="w-full pl-9 pr-8 py-2 text-xs glass-input rounded-xl text-slate-800 outline-none"
              />
              <button
                onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modern Frosted Scrollable Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 border-t border-slate-200/50">
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
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono-num font-bold ${
                      isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
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
