import React, { useState, useMemo } from 'react';
import {
  Plus,
  Eye,
  Trash2,
  Edit2,
  Download,
  Calendar,
  Layers,
  Users,
  Search,
  Filter,
  RotateCcw,
  FileCheck,
  FileText
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { storageService, DEFAULT_PARTNERS, DEFAULT_SPEND_AREAS, normalizePayerName } from '../services/storage';
import { CustomSelect } from './ui/CustomSelect';
import { CustomDatePicker } from './ui/CustomDatePicker';

export function ExpensesTab({
  expenses = [],
  partners = DEFAULT_PARTNERS,
  spendAreas = DEFAULT_SPEND_AREAS,
  onOpenExpenseModal,
  onEditExpense,
  onDeleteExpense,
  onViewProof,
  onViewImpact,
  selectedSpendArea = 'All',
  setSelectedSpendArea,
  selectedPayer = 'All',
  setSelectedPayer,
  searchQuery = ''
}) {
  const [filterPayer, setFilterPayer] = useState(selectedPayer || 'All');
  const [filterSpendArea, setFilterSpendArea] = useState(selectedSpendArea || 'All');
  const [filterDatePreset, setFilterDatePreset] = useState('All');
  const [filterCustomDate, setFilterCustomDate] = useState('');
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [sortBy, setSortBy] = useState('date-desc');

  // Keep internal filters in sync with parent props
  React.useEffect(() => {
    if (selectedPayer) setFilterPayer(selectedPayer);
  }, [selectedPayer]);

  React.useEffect(() => {
    if (selectedSpendArea) setFilterSpendArea(selectedSpendArea);
  }, [selectedSpendArea]);

  React.useEffect(() => {
    if (searchQuery !== undefined) setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Compute all unique spend areas
  const allSpendAreas = useMemo(() => {
    const set = new Set(spendAreas || DEFAULT_SPEND_AREAS);
    expenses.forEach(e => {
      if (e.spendArea?.trim()) set.add(e.spendArea.trim());
      if (e.category?.trim()) set.add(e.category.trim());
    });
    return ['All', ...Array.from(set)];
  }, [spendAreas, expenses]);

  // Unique payers
  const allPayers = useMemo(() => {
    const set = new Set();
    partners.forEach(p => set.add(p.name));
    expenses.forEach(e => {
      if (e.payer?.trim()) {
        set.add(normalizePayerName(e.payer, partners));
      }
    });
    return ['All', ...Array.from(set)];
  }, [partners, expenses]);

  // Local date helper
  const getLocalDate = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (filterSpendArea !== 'All') {
        const area = e.spendArea || e.category || '';
        if (area.toLowerCase() !== filterSpendArea.toLowerCase()) return false;
      }

      if (filterPayer !== 'All') {
        const norm = normalizePayerName(e.payer, partners);
        if (norm.toLowerCase() !== filterPayer.toLowerCase()) return false;
      }

      if (filterDatePreset !== 'All') {
        const todayStr = getLocalDate(new Date());
        if (filterDatePreset === 'Today' && e.date !== todayStr) return false;
        if (filterDatePreset === '7d') {
          const limit = new Date();
          limit.setDate(limit.getDate() - 7);
          if ((e.date || '') < getLocalDate(limit)) return false;
        }
        if (filterDatePreset === '30d') {
          const limit = new Date();
          limit.setDate(limit.getDate() - 30);
          if ((e.date || '') < getLocalDate(limit)) return false;
        }
        if (filterDatePreset === 'Custom' && filterCustomDate && e.date !== filterCustomDate) {
          return false;
        }
      }

      if (localSearch) {
        const q = localSearch.toLowerCase();
        const vendor = (e.vendor || '').toLowerCase();
        const payer = (e.payer || '').toLowerCase();
        const area = (e.spendArea || e.category || '').toLowerCase();
        const utr = (e.utrNumber || '').toLowerCase();
        const notes = (e.howItHelped || '').toLowerCase();
        if (!vendor.includes(q) && !payer.includes(q) && !area.includes(q) && !utr.includes(q) && !notes.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [expenses, filterSpendArea, filterPayer, filterDatePreset, filterCustomDate, localSearch, partners]);

  // Sort
  const sortedExpenses = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00'));
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date + ' ' + (a.time || '00:00')) - new Date(b.date + ' ' + (b.time || '00:00'));
      }
      if (sortBy === 'amount-desc') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'amount-asc') return Number(a.amount) - Number(b.amount);
      return 0;
    });
  }, [filteredExpenses, sortBy]);

  const totalFilteredSpent = useMemo(() => {
    return sortedExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [sortedExpenses]);

  const proofCount = useMemo(() => {
    return sortedExpenses.filter(e => !!e.proofDataUrl).length;
  }, [sortedExpenses]);

  const handleResetFilters = () => {
    setFilterPayer('All');
    setFilterSpendArea('All');
    setFilterDatePreset('All');
    setFilterCustomDate('');
    setLocalSearch('');
    if (setSelectedPayer) setSelectedPayer('All');
    if (setSelectedSpendArea) setSelectedSpendArea('All');
  };

  const hasActiveFilters = filterPayer !== 'All' || filterSpendArea !== 'All' || filterDatePreset !== 'All' || localSearch !== '';

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
            Expense Ledger
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Audit-ready log of operational expenditures and receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => storageService.exportCsv(expenses)}
            disabled={expenses.length === 0}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Expense</span>
          </button>
        </div>
      </div>

      {/* 3 Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Filtered Total Spent
          </div>
          <div className="text-2xl font-bold font-mono-num text-zinc-950 dark:text-white">
            ₹{totalFilteredSpent.toLocaleString('en-IN')}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {sortedExpenses.length} transaction{sortedExpenses.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Receipt Verification
          </div>
          <div className="text-2xl font-bold font-mono-num text-zinc-950 dark:text-white">
            {proofCount} / {sortedExpenses.length}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {sortedExpenses.length > 0 && proofCount === sortedExpenses.length
              ? '100% verified with proofs'
              : `${sortedExpenses.length - proofCount} unattached receipts`}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Active Filter Scope
          </div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate mt-1">
            {filterPayer !== 'All' ? filterPayer : filterSpendArea !== 'All' ? filterSpendArea : 'All Operations'}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {hasActiveFilters ? 'Custom filter active' : 'Showing all records'}
          </div>
        </div>
      </div>

      {/* Professional Filter Bar */}
      <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search payee, UTR, note..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-400 outline-none"
            />
          </div>

          {/* Partner / Payer Filter */}
          <CustomSelect
            value={filterPayer}
            onChange={(val) => {
              setFilterPayer(val);
              if (setSelectedPayer) setSelectedPayer(val);
            }}
            options={allPayers.map(p => ({ value: p, label: p === 'All' ? 'All Partners' : p }))}
            size="sm"
          />

          {/* Spend Area Filter */}
          <CustomSelect
            value={filterSpendArea}
            onChange={(val) => {
              setFilterSpendArea(val);
              if (setSelectedSpendArea) setSelectedSpendArea(val);
            }}
            options={allSpendAreas.map(a => ({ value: a, label: a === 'All' ? 'All Spend Areas' : a }))}
            size="sm"
          />

          {/* Date Filter */}
          <CustomSelect
            value={filterDatePreset}
            onChange={(val) => setFilterDatePreset(val)}
            options={[
              { value: 'All', label: 'All Dates' },
              { value: 'Today', label: 'Today' },
              { value: '7d', label: 'Last 7 Days' },
              { value: '30d', label: 'Last 30 Days' },
              { value: 'Custom', label: 'Exact Date...' }
            ]}
            size="sm"
          />

          {/* Sort By */}
          <CustomSelect
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={[
              { value: 'date-desc', label: 'Date: Newest First' },
              { value: 'date-asc', label: 'Date: Oldest First' },
              { value: 'amount-desc', label: 'Amount: High to Low' },
              { value: 'amount-asc', label: 'Amount: Low to High' }
            ]}
            size="sm"
          />
        </div>

        {/* Custom Date Input (if selected) */}
        {filterDatePreset === 'Custom' && (
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-xs text-zinc-500">Pick date:</span>
            <div className="w-40">
              <CustomDatePicker
                value={filterCustomDate}
                onChange={setFilterCustomDate}
                size="sm"
              />
            </div>
          </div>
        )}

        {/* Active Filter Clear link */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-800">
            <span className="text-zinc-500">
              Showing {sortedExpenses.length} of {expenses.length} records
            </span>
            <button
              onClick={handleResetFilters}
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-medium cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Expense Table */}
      {sortedExpenses.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No expenditures found"
          description={hasActiveFilters ? "No transactions match your active filters. Try resetting filters." : "No expenses have been recorded yet."}
          actionLabel={hasActiveFilters ? "Reset Filters" : "Record First Expense"}
          onAction={hasActiveFilters ? handleResetFilters : onOpenExpenseModal}
        />
      ) : (
        <div>
          {/* Mobile Card List (under md) */}
          <div className="md:hidden space-y-3">
            {sortedExpenses.map((e) => (
              <div
                key={e.id}
                className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-zinc-950 dark:text-white text-sm truncate">
                      {e.vendor || e.category || 'General Expense'}
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono-num flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span>{e.date}</span>
                      {e.time && <span>• {e.time}</span>}
                      <span>• {e.spendArea || e.category || 'General'}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold font-mono-num text-zinc-950 dark:text-white text-base">
                      ₹{Number(e.amount).toLocaleString('en-IN')}
                    </div>
                    <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 mt-0.5">
                      {e.paymentMode || 'UPI'}
                    </span>
                  </div>
                </div>

                {e.howItHelped && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {e.howItHelped}
                  </p>
                )}

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 text-[11px] truncate mr-2">
                    <span className="text-zinc-400 shrink-0">Paid by:</span>
                    <span className="font-semibold truncate">{normalizePayerName(e.payer, partners)}</span>
                    {e.utrNumber && (
                      <span className="text-zinc-400 font-mono-num hidden sm:inline">({e.utrNumber})</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {e.proofDataUrl && (() => {
                      const isPdf = e.proofType === 'application/pdf' || e.proofName?.toLowerCase().endsWith('.pdf') || e.proofDataUrl.startsWith('data:application/pdf');
                      return (
                        <button
                          onClick={() => onViewProof(e)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                            isPdf
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                          }`}
                        >
                          {isPdf ? <FileText className="w-3 h-3 text-rose-600 dark:text-rose-400" /> : <Eye className="w-3 h-3" />}
                          <span>{isPdf ? 'PDF' : 'Proof'}</span>
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => onEditExpense(e)}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(e.id)}
                      className="p-1 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (md and up) */}
          <div className="hidden md:block rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payee / Description</th>
                    <th className="py-3 px-4">Paid By</th>
                    <th className="py-3 px-4">Spend Area</th>
                    <th className="py-3 px-4">Mode</th>
                    <th className="py-3 px-4 text-center">Receipt</th>
                    <th className="py-3 px-4 font-mono-num text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {sortedExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono-num text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                        {e.date}
                        {e.time && <span className="text-[10px] text-zinc-400 block">{e.time}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-950 dark:text-white">
                          {e.vendor || e.category || 'General Expense'}
                        </div>
                        {e.howItHelped && (
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-1">
                            {e.howItHelped}
                          </div>
                        )}
                        {e.utrNumber && (
                          <div className="text-[10px] font-mono-num text-zinc-400">
                            Ref: {e.utrNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {normalizePayerName(e.payer, partners)}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                        {e.spendArea || e.category || 'General'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400 font-mono-num text-[11px]">
                        {e.paymentMode || 'UPI'}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {e.proofDataUrl ? (() => {
                          const isPdf = e.proofType === 'application/pdf' || e.proofName?.toLowerCase().endsWith('.pdf') || e.proofDataUrl.startsWith('data:application/pdf');
                          return (
                            <button
                              onClick={() => onViewProof(e)}
                              className={`inline-flex items-center gap-1 text-[11px] font-medium hover:underline cursor-pointer ${
                                isPdf
                                  ? 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
                                  : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white'
                              }`}
                            >
                              {isPdf ? <FileText className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5 text-zinc-500" />}
                              <span>{isPdf ? 'PDF' : 'View'}</span>
                            </button>
                          );
                        })() : (
                          <span className="text-zinc-300 dark:text-zinc-600 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono-num font-bold text-zinc-950 dark:text-white text-right whitespace-nowrap text-xs">
                        ₹{Number(e.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => onEditExpense(e)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteExpense(e.id)}
                            className="p-1 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
