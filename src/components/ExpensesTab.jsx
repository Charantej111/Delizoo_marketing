import React, { useState, useMemo } from 'react';
import {
  Plus,
  Eye,
  Trash2,
  Edit2,
  Download,
  IndianRupee,
  FileCheck,
  User,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  Tag,
  Users
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { storageService, DEFAULT_PARTNERS, POPULAR_CATEGORIES } from '../services/storage';
import { CustomSelect } from './ui/CustomSelect';
import { CustomDatePicker } from './ui/CustomDatePicker';

export function ExpensesTab({
  expenses,
  projects,
  partners = DEFAULT_PARTNERS,
  onOpenExpenseModal,
  onEditExpense,
  onDeleteExpense,
  onViewProof,
  onViewImpact,
  selectedProjectId,
  setSelectedProjectId,
  selectedPayer = 'All',
  setSelectedPayer,
  searchQuery
}) {
  const [filterPayer, setFilterPayer] = useState(selectedPayer || 'All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPaymentMode, setFilterPaymentMode] = useState('All');
  const [filterDatePreset, setFilterDatePreset] = useState('All');
  const [filterCustomDate, setFilterCustomDate] = useState('');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, amount-desc, amount-asc

  // Keep internal filter in sync with prop if set from outside
  React.useEffect(() => {
    if (selectedPayer) {
      setFilterPayer(selectedPayer);
    }
  }, [selectedPayer]);

  const projMap = useMemo(() => {
    const map = {};
    projects.forEach(p => { map[p.id] = p; });
    return map;
  }, [projects]);

  // Combine predefined partners with any additional unique payers found in expenses
  const allPayers = useMemo(() => {
    const set = new Set();
    partners.forEach(p => set.add(p.name));
    expenses.forEach(e => {
      if (e.payer?.trim()) set.add(e.payer.trim());
    });
    return ['All', ...Array.from(set)];
  }, [partners, expenses]);

  // Dynamically extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    POPULAR_CATEGORIES.forEach(c => set.add(c.label));
    expenses.forEach(e => {
      if (e.category?.trim()) set.add(e.category.trim());
    });
    return ['All', ...Array.from(set)];
  }, [expenses]);

  // Dynamic filter
  const filteredExpenses = expenses.filter(e => {
    if (selectedProjectId && selectedProjectId !== 'All' && e.projectId !== selectedProjectId) return false;
    if (filterPayer !== 'All' && e.payer?.trim().toLowerCase() !== filterPayer.toLowerCase()) return false;
    if (filterCategory !== 'All' && e.category?.trim().toLowerCase() !== filterCategory.toLowerCase()) return false;
    if (filterPaymentMode !== 'All' && !(e.paymentMode || '').includes(filterPaymentMode)) return false;

    // Date / Period filter
    if (filterDatePreset !== 'All') {
      const todayStr = new Date().toISOString().split('T')[0];
      if (filterDatePreset === 'Today') {
        if (e.date !== todayStr) return false;
      } else if (filterDatePreset === '7d') {
        const d = new Date(e.date);
        const limit = new Date();
        limit.setDate(limit.getDate() - 7);
        if (d < limit) return false;
      } else if (filterDatePreset === '30d') {
        const d = new Date(e.date);
        const limit = new Date();
        limit.setDate(limit.getDate() - 30);
        if (d < limit) return false;
      } else if (filterDatePreset === 'Custom') {
        if (filterCustomDate && e.date !== filterCustomDate) return false;
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchVendor = (e.vendor || '').toLowerCase().includes(q);
      const matchPayer = (e.payer || '').toLowerCase().includes(q);
      const matchCategory = (e.category || '').toLowerCase().includes(q);
      const matchUtr = (e.utrNumber || '').toLowerCase().includes(q);
      const matchImpact = (e.howItHelped || '').toLowerCase().includes(q);
      const matchProj = (projMap[e.projectId]?.title || '').toLowerCase().includes(q);
      if (!matchVendor && !matchPayer && !matchCategory && !matchUtr && !matchImpact && !matchProj) return false;
    }
    return true;
  });

  // Sort
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00'));
    }
    if (sortBy === 'date-asc') {
      return new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00'));
    }
    if (sortBy === 'amount-desc') {
      return (Number(b.amount) || 0) - (Number(a.amount) || 0);
    }
    if (sortBy === 'amount-asc') {
      return (Number(a.amount) || 0) - (Number(b.amount) || 0);
    }
    return 0;
  });

  const totalFilteredSpent = sortedExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const proofCount = sortedExpenses.filter(e => !!e.proofDataUrl).length;

  const handlePayerChange = (payer) => {
    setFilterPayer(payer);
    if (setSelectedPayer) setSelectedPayer(payer);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Financial Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Total Spent in View
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono-num text-zinc-900 dark:text-white">
            ₹{totalFilteredSpent.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {sortedExpenses.length} transactions recorded
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Verified Receipts
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono-num text-emerald-600 dark:text-emerald-400">
            {proofCount} / {sortedExpenses.length}
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {sortedExpenses.length > 0 && proofCount === sortedExpenses.length
              ? '100% verified compliance'
              : `${sortedExpenses.length - proofCount} pending receipts`}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Active Filter
          </span>
          <div className="text-sm font-bold text-zinc-900 dark:text-white truncate mt-1">
            {filterPayer !== 'All' ? `Paid by: ${filterPayer}` : filterCategory !== 'All' ? `Type: ${filterCategory}` : 'All Team Transactions'}
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono-num">
            {sortedExpenses.length} bills displayed
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
              Quick Actions
            </span>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Export ledger or record bill</div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => storageService.exportCsv(expenses, projects)}
              disabled={expenses.length === 0}
              className="px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={onOpenExpenseModal}
              className="flex-1 px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold transition-all text-center shadow-sm active:scale-[0.98] cursor-pointer"
            >
              + Log Expense
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Filter Controls & Quick Partner Chips */}
      {expenses.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
          {/* Quick Partner 1-Click Filter Chips */}
          <div className="space-y-2 pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Filter by Investor / Partner (Who Paid):
              </span>
              {filterPayer !== 'All' && (
                <button
                  onClick={() => handlePayerChange('All')}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Show All Partners
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {allPayers.map(p => {
                const isSelected = filterPayer.toLowerCase() === p.toLowerCase();
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePayerChange(p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 border-zinc-900 dark:border-emerald-500 shadow-2xs'
                        : 'bg-white dark:bg-zinc-850 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    {p === 'All' ? '👥 All Partners' : p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Category Filter Chips */}
          <div className="space-y-2 pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
                Filter by Spend Type (Ads, Cards, Fleet, Ops):
              </span>
              {filterCategory !== 'All' && (
                <button
                  onClick={() => setFilterCategory('All')}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Show All Types
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categories.map(c => {
                const isSelected = filterCategory.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFilterCategory(c)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 border-zinc-900 dark:border-emerald-500 font-bold shadow-2xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    {c === 'All' ? 'All Types' : c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-parameter Dropdown Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Project Filter */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mb-1">PROJECT</label>
              <CustomSelect
                value={selectedProjectId || 'All'}
                onChange={setSelectedProjectId}
                size="sm"
                searchable={projects.length > 5}
                options={[
                  { value: 'All', label: 'All Projects' },
                  ...projects.map(p => ({ value: p.id, label: p.title }))
                ]}
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mb-1">PAYMENT MODE</label>
              <CustomSelect
                value={filterPaymentMode}
                onChange={setFilterPaymentMode}
                size="sm"
                options={[
                  { value: 'All', label: 'All Modes' },
                  { value: 'UPI', label: 'UPI' },
                  { value: 'Cash', label: 'Cash Voucher' },
                  { value: 'Bank', label: 'Bank Transfer' },
                  { value: 'Card', label: 'Card' }
                ]}
              />
            </div>

            {/* Date / Period Filter */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mb-1">TIMEFRAME</label>
              <CustomSelect
                value={filterDatePreset}
                onChange={(val) => {
                  setFilterDatePreset(val);
                  if (val !== 'Custom') setFilterCustomDate('');
                }}
                size="sm"
                options={[
                  { value: 'All', label: 'All Time' },
                  { value: 'Today', label: 'Today Only' },
                  { value: '7d', label: 'Last 7 Days' },
                  { value: '30d', label: 'Last 30 Days' },
                  { value: 'Custom', label: 'Specific Date...' }
                ]}
              />
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 mb-1">SORT ORDER</label>
              <CustomSelect
                value={sortBy}
                onChange={setSortBy}
                size="sm"
                options={[
                  { value: 'date-desc', label: 'Date (Newest)' },
                  { value: 'date-asc', label: 'Date (Oldest)' },
                  { value: 'amount-desc', label: 'Amount (Highest)' },
                  { value: 'amount-asc', label: 'Amount (Lowest)' }
                ]}
              />
            </div>
          </div>

          {/* Custom Date picker */}
          {filterDatePreset === 'Custom' && (
            <div className="pt-2 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Select Date:</span>
              <div className="w-56">
                <CustomDatePicker
                  value={filterCustomDate}
                  onChange={setFilterCustomDate}
                  size="sm"
                  placeholder="Choose date to filter"
                />
              </div>
              {filterCustomDate && (
                <button
                  type="button"
                  onClick={() => setFilterCustomDate('')}
                  className="text-xs text-rose-500 hover:text-rose-400 font-semibold cursor-pointer"
                >
                  Clear date
                </button>
              )}
            </div>
          )}

          {(selectedProjectId !== 'All' || filterPayer !== 'All' || filterCategory !== 'All' || filterPaymentMode !== 'All' || filterDatePreset !== 'All' || filterCustomDate) && (
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => {
                  setSelectedProjectId('All');
                  handlePayerChange('All');
                  setFilterCategory('All');
                  setFilterPaymentMode('All');
                  setFilterDatePreset('All');
                  setFilterCustomDate('');
                }}
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 hover:underline transition-all cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            </div>
          )}
        </div>
      )}

      {expenses.length === 0 ? (
        <EmptyState
          type="expenses"
          title="No expenditures logged yet"
          description="Record each payment with date, who funded the amount, payment proof image, and how it helped the project."
          actionText="Log Your First Expense"
          onAction={onOpenExpenseModal}
        />
      ) : (
        <>
          {/* Mobile Card List (Shows on screens < 768px for optimal phone readability) */}
          <div className="md:hidden space-y-3">
            {sortedExpenses.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8">
                No expenditures match the current filter selection.
              </p>
            ) : (
              sortedExpenses.map(exp => {
                const proj = projMap[exp.projectId];

                return (
                  <div
                    key={exp.id}
                    className="glass-panel rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-lg font-black font-mono-num text-zinc-900 dark:text-white">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                          {exp.vendor || 'Direct Payee'}
                        </div>
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono-num">
                          {exp.date} {exp.time ? `• ${exp.time}` : ''}
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-200/70 dark:border-emerald-800/70">
                        {exp.payer}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <div>
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{proj ? proj.title : 'General'}</span>
                        <span className="mx-1">•</span>
                        <span>{exp.paymentMode || 'UPI'}</span>
                      </div>
                      {exp.category && (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">
                          {exp.category}
                        </span>
                      )}
                    </div>

                    {exp.howItHelped && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50/70 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-700 italic leading-relaxed">
                        “{exp.howItHelped}”
                      </p>
                    )}

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {exp.proofDataUrl && (
                          <button
                            onClick={() => onViewProof(exp)}
                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                            <span>Proof</span>
                          </button>
                        )}
                        {exp.howItHelped && (
                          <button
                            onClick={() => onViewImpact(exp)}
                            className="px-2.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                          >
                            Impact
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop High-Density Table View (Hidden on mobile < 768px) */}
          <div className="hidden md:block glass-panel rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Amount & Type</th>
                    <th className="py-3 px-4">Who Paid</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Vendor & Mode</th>
                    <th className="py-3 px-4">Proof</th>
                    <th className="py-3 px-4">How It Helped (ROI)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {sortedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-zinc-400 dark:text-zinc-500">
                        No expenditures match the current filter selection.
                      </td>
                    </tr>
                  ) : (
                    sortedExpenses.map(exp => {
                      const proj = projMap[exp.projectId];

                      return (
                        <tr key={exp.id} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono-num font-bold text-zinc-900 dark:text-white">{exp.date}</div>
                            {exp.time && (
                              <div className="font-mono-num text-[11px] text-zinc-400 dark:text-zinc-500">{exp.time}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-sm font-black font-mono-num text-zinc-900 dark:text-white">
                              ₹{Number(exp.amount).toLocaleString('en-IN')}
                            </div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-[10px] border border-zinc-200/70 dark:border-zinc-700">
                              {exp.category || 'General'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs border border-emerald-200/60 dark:border-emerald-800/60">
                              <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>{exp.payer}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-bold text-zinc-900 dark:text-white truncate">
                              {proj ? proj.title : 'General Initiative'}
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                              {proj ? proj.department : (exp.department || 'General')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-zinc-900 dark:text-white">{exp.vendor || 'Direct Payee'}</div>
                            <div className="font-mono-num text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                              <span>{exp.paymentMode || 'UPI'}</span>
                              {exp.utrNumber && (
                                <span className="text-zinc-400 dark:text-zinc-500"> • {exp.utrNumber}</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {exp.proofDataUrl ? (
                              <button
                                onClick={() => onViewProof(exp)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 shadow-2xs transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
                                <span>View Proof</span>
                              </button>
                            ) : (
                              <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">No proof</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            {exp.howItHelped ? (
                              <div className="space-y-1">
                                <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                                  {exp.howItHelped}
                                </p>
                                <button
                                  onClick={() => onViewImpact(exp)}
                                  className="text-[11px] font-bold text-zinc-800 dark:text-emerald-400 hover:text-zinc-900 dark:hover:text-emerald-300 underline cursor-pointer"
                                >
                                  Read Impact →
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400 dark:text-zinc-500 italic">No notes</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => onEditExpense(exp)}
                              className="p-1 rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => onDeleteExpense(exp.id)}
                              className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
