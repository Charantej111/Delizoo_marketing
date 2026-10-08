import React, { useState, useMemo } from 'react';
import {
  Plus,
  Eye,
  Trash2,
  Edit2,
  Download,
  IndianRupee,
  User,
  RotateCcw,
  Calendar,
  Layers,
  Tag,
  Users,
  FileCheck
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { storageService, DEFAULT_PARTNERS, POPULAR_CATEGORIES, SPEND_AREAS, normalizePayerName } from '../services/storage';
import { CustomSelect } from './ui/CustomSelect';
import { CustomDatePicker } from './ui/CustomDatePicker';

export function ExpensesTab({
  expenses,
  partners = DEFAULT_PARTNERS,
  onOpenExpenseModal,
  onEditExpense,
  onDeleteExpense,
  onViewProof,
  onViewImpact,
  selectedSpendArea = 'All',
  setSelectedSpendArea,
  selectedPayer = 'All',
  setSelectedPayer,
  searchQuery
}) {
  const [filterPayer, setFilterPayer] = useState(selectedPayer || 'All');
  const [filterSpendArea, setFilterSpendArea] = useState(selectedSpendArea || 'All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPaymentMode, setFilterPaymentMode] = useState('All');
  const [filterDatePreset, setFilterDatePreset] = useState('All');
  const [filterCustomDate, setFilterCustomDate] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Keep internal filter in sync with props
  React.useEffect(() => {
    if (selectedPayer) setFilterPayer(selectedPayer);
  }, [selectedPayer]);

  React.useEffect(() => {
    if (selectedSpendArea) setFilterSpendArea(selectedSpendArea);
  }, [selectedSpendArea]);

  // Combine predefined 6 partners and deduplicate any legacy aliases
  const allPayers = useMemo(() => {
    const set = new Set();
    partners.forEach(p => set.add(p.name));
    expenses.forEach(e => {
      if (e.payer?.trim()) {
        const normalized = normalizePayerName(e.payer, partners);
        set.add(normalized);
      }
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
    if (filterSpendArea !== 'All') {
      const area = e.spendArea || e.category || '';
      if (area.toLowerCase() !== filterSpendArea.toLowerCase()) return false;
    }
    
    if (filterPayer !== 'All') {
      const normalizedPayer = normalizePayerName(e.payer, partners);
      if (normalizedPayer.toLowerCase() !== filterPayer.toLowerCase()) return false;
    }

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
      const matchPayer = (e.payer || '').toLowerCase().includes(q) || normalizePayerName(e.payer, partners).toLowerCase().includes(q);
      const matchCategory = (e.category || '').toLowerCase().includes(q);
      const matchSpendArea = (e.spendArea || '').toLowerCase().includes(q);
      const matchUtr = (e.utrNumber || '').toLowerCase().includes(q);
      const matchImpact = (e.howItHelped || '').toLowerCase().includes(q);
      if (!matchVendor && !matchPayer && !matchCategory && !matchSpendArea && !matchUtr && !matchImpact) return false;
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

  const handleSpendAreaChange = (area) => {
    setFilterSpendArea(area);
    if (setSelectedSpendArea) setSelectedSpendArea(area);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Financial Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Filtered Total Spent
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
            Receipt Verification
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono-num text-emerald-600 dark:text-emerald-400">
            {proofCount} / {sortedExpenses.length}
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {sortedExpenses.length > 0 && proofCount === sortedExpenses.length
              ? 'All receipts verified'
              : `${sortedExpenses.length - proofCount} pending receipts`}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
            Active Filter Scope
          </span>
          <div className="text-sm font-bold text-zinc-900 dark:text-white truncate mt-1">
            {filterPayer !== 'All' ? `Partner: ${filterPayer}` : filterSpendArea !== 'All' ? `Area: ${filterSpendArea}` : 'All Venture Operations'}
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono-num">
            {sortedExpenses.length} transactions shown
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
              Quick Actions
            </span>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Export audit ledger or record spend</div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => storageService.exportCsv(expenses)}
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

      {/* Filter Controls & Quick Partner Chips */}
      {expenses.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
          {/* Quick Partner Filter Chips */}
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
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 border-zinc-900 dark:border-emerald-500 font-bold shadow-2xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    {p === 'All' ? 'All Partners' : p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Spend Area Filter Chips */}
          <div className="space-y-2 pb-1 border-b border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" />
                Filter by Spend Area (Ads, Printing, Fleet, Logistics):
              </span>
              {filterSpendArea !== 'All' && (
                <button
                  onClick={() => handleSpendAreaChange('All')}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Show All Areas
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleSpendAreaChange('All')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                  filterSpendArea === 'All'
                    ? 'bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 border-zinc-900 dark:border-emerald-500 font-bold shadow-2xs'
                    : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                All Spend Areas
              </button>
              {SPEND_AREAS.map(area => {
                const isSelected = filterSpendArea.toLowerCase() === area.toLowerCase();
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => handleSpendAreaChange(area)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 border-zinc-900 dark:border-emerald-500 font-bold shadow-2xs'
                        : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multi-parameter Dropdown Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          {(filterSpendArea !== 'All' || filterPayer !== 'All' || filterCategory !== 'All' || filterPaymentMode !== 'All' || filterDatePreset !== 'All' || filterCustomDate) && (
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => {
                  handleSpendAreaChange('All');
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
          description="Record each payment with date, spend area, who funded the amount, receipt proof, and business impact."
          actionText="Log Your First Expense"
          onAction={onOpenExpenseModal}
        />
      ) : (
        <>
          {/* Mobile Card List (< 768px) */}
          <div className="md:hidden space-y-3">
            {sortedExpenses.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-8">
                No expenditures match the current filter selection.
              </p>
            ) : (
              sortedExpenses.map(exp => {
                const canonicalPayer = normalizePayerName(exp.payer, partners);
                const spendArea = exp.spendArea || exp.category || 'General Operations';

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

                      <span className="px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs border border-zinc-200/80 dark:border-zinc-700">
                        {canonicalPayer}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                      <div>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{spendArea}</span>
                        <span className="mx-1">•</span>
                        <span>{exp.paymentMode || 'UPI'}</span>
                      </div>
                      {exp.category && exp.category !== spendArea && (
                        <span className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                          {exp.category}
                        </span>
                      )}
                    </div>

                    {exp.howItHelped && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50/70 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-700 leading-relaxed">
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

          {/* Desktop High-Density Table View */}
          <div className="hidden md:block glass-panel rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100/90 dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Who Paid</th>
                    <th className="py-3 px-4">Spend Area / Stream</th>
                    <th className="py-3 px-4">Vendor & Mode</th>
                    <th className="py-3 px-4">Receipt</th>
                    <th className="py-3 px-4">Business Impact</th>
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
                      const canonicalPayer = normalizePayerName(exp.payer, partners);
                      const spendArea = exp.spendArea || exp.category || 'General Operations';

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
                            {exp.category && exp.category !== spendArea && (
                              <span className="inline-block mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                                {exp.category}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs border border-zinc-200/80 dark:border-zinc-700">
                              <User className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                              <span>{canonicalPayer}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-bold text-zinc-900 dark:text-white truncate">
                              {spendArea}
                            </div>
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
                                <span>Proof</span>
                              </button>
                            ) : (
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">No proof</span>
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
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">No notes</span>
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

