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
  Layers
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { storageService } from '../services/storage';

export function ExpensesTab({
  expenses,
  projects,
  onOpenExpenseModal,
  onEditExpense,
  onDeleteExpense,
  onViewProof,
  onViewImpact,
  selectedProjectId,
  setSelectedProjectId,
  searchQuery
}) {
  const [filterPayer, setFilterPayer] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPaymentMode, setFilterPaymentMode] = useState('All');
  const [sortBy, setSortBy] = useState('date-desc'); // date-desc, date-asc, amount-desc, amount-asc

  const projMap = useMemo(() => {
    const map = {};
    projects.forEach(p => { map[p.id] = p; });
    return map;
  }, [projects]);

  // Dynamically extract unique payers
  const payers = useMemo(() => {
    const set = new Set();
    expenses.forEach(e => {
      if (e.payer?.trim()) set.add(e.payer.trim());
    });
    return ['All', ...Array.from(set)];
  }, [expenses]);

  // Dynamically extract unique categories
  const categories = useMemo(() => {
    const set = new Set();
    expenses.forEach(e => {
      if (e.category?.trim()) set.add(e.category.trim());
    });
    return ['All', ...Array.from(set)];
  }, [expenses]);

  // Dynamic filter
  const filteredExpenses = expenses.filter(e => {
    if (selectedProjectId && selectedProjectId !== 'All' && e.projectId !== selectedProjectId) return false;
    if (filterPayer !== 'All' && e.payer?.trim() !== filterPayer) return false;
    if (filterCategory !== 'All' && e.category?.trim() !== filterCategory) return false;
    if (filterPaymentMode !== 'All' && !(e.paymentMode || '').includes(filterPaymentMode)) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchVendor = (e.vendor || '').toLowerCase().includes(q);
      const matchPayer = (e.payer || '').toLowerCase().includes(q);
      const matchUtr = (e.utrNumber || '').toLowerCase().includes(q);
      const matchImpact = (e.howItHelped || '').toLowerCase().includes(q);
      const matchProj = (projMap[e.projectId]?.title || '').toLowerCase().includes(q);
      if (!matchVendor && !matchPayer && !matchUtr && !matchImpact && !matchProj) return false;
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

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Financial Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Total Spent in View
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono-num text-slate-900">
            ₹{totalFilteredSpent.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {sortedExpenses.length} transactions recorded
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Verified Receipts
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono-num text-emerald-600">
            {proofCount} / {sortedExpenses.length}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {sortedExpenses.length > 0 && proofCount === sortedExpenses.length
              ? '100% verified compliance'
              : `${sortedExpenses.length - proofCount} pending receipts`}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Top Funding Source
          </span>
          <div className="text-base sm:text-lg font-bold text-slate-900 truncate mt-1">
            {payers.length > 1 ? payers[1] : '—'}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {payers.length > 1 ? 'Leading capital provider' : 'No sources yet'}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Quick Actions
            </span>
            <div className="text-xs text-slate-500">Export ledger or record bill</div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => storageService.exportCsv(expenses, projects)}
              disabled={expenses.length === 0}
              className="px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white/90 hover:bg-white text-slate-700 text-xs font-bold transition-all flex items-center gap-1 shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={onOpenExpenseModal}
              className="flex-1 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all text-center shadow-sm"
            >
              + Log Expense
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Filter Controls */}
      {expenses.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Filter & Sort Ledger</h3>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs glass-input rounded-lg px-2 py-1 font-semibold text-slate-800 outline-none"
              >
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="amount-desc">Amount (Highest)</option>
                <option value="amount-asc">Amount (Lowest)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Project Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">PROJECT</label>
              <select
                value={selectedProjectId || 'All'}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full text-xs glass-input rounded-xl px-2.5 py-1.5 font-medium text-slate-800 outline-none"
              >
                <option value="All">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Who gave amount Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">WHO GAVE AMOUNT</label>
              <select
                value={filterPayer}
                onChange={(e) => setFilterPayer(e.target.value)}
                className="w-full text-xs glass-input rounded-xl px-2.5 py-1.5 font-medium text-slate-800 outline-none"
              >
                {payers.map(p => (
                  <option key={p} value={p}>{p === 'All' ? 'All Contributors' : p}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">CATEGORY</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full text-xs glass-input rounded-xl px-2.5 py-1.5 font-medium text-slate-800 outline-none"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">PAYMENT MODE</label>
              <select
                value={filterPaymentMode}
                onChange={(e) => setFilterPaymentMode(e.target.value)}
                className="w-full text-xs glass-input rounded-xl px-2.5 py-1.5 font-medium text-slate-800 outline-none"
              >
                <option value="All">All Modes</option>
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Cash">Cash Voucher</option>
                <option value="Bank">Bank Transfer / IMPS / NEFT</option>
                <option value="Card">Debit / Credit Card</option>
              </select>
            </div>
          </div>

          {(selectedProjectId !== 'All' || filterPayer !== 'All' || filterCategory !== 'All' || filterPaymentMode !== 'All') && (
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => {
                  setSelectedProjectId('All');
                  setFilterPayer('All');
                  setFilterCategory('All');
                  setFilterPaymentMode('All');
                }}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
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
              <p className="text-xs text-slate-400 text-center py-8">
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
                        <div className="text-lg font-black font-mono-num text-slate-900">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs font-semibold text-slate-800 mt-0.5">
                          {exp.vendor || 'Direct Payee'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono-num">
                          {exp.date} {exp.time ? `• ${exp.time}` : ''}
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200/70">
                        {exp.payer}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div>
                        <span className="font-medium text-slate-700">{proj ? proj.title : 'General'}</span>
                        <span className="mx-1">•</span>
                        <span>{exp.paymentMode || 'UPI'}</span>
                      </div>
                      {exp.category && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {exp.category}
                        </span>
                      )}
                    </div>

                    {exp.howItHelped && (
                      <p className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/50 italic leading-relaxed">
                        “{exp.howItHelped}”
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {exp.proofDataUrl && (
                          <button
                            onClick={() => onViewProof(exp)}
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>Proof</span>
                          </button>
                        )}
                        {exp.howItHelped && (
                          <button
                            onClick={() => onViewImpact(exp)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-xs font-bold text-slate-800"
                          >
                            Impact
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditExpense(exp)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
                <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Who Gave Amount</th>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Vendor & Mode</th>
                    <th className="py-3 px-4">Proof</th>
                    <th className="py-3 px-4">How It Helped (Impact & ROI)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400">
                        No expenditures match the current filter selection.
                      </td>
                    </tr>
                  ) : (
                    sortedExpenses.map(exp => {
                      const proj = projMap[exp.projectId];

                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono-num font-bold text-slate-900">{exp.date}</div>
                            {exp.time && (
                              <div className="font-mono-num text-[11px] text-slate-400">{exp.time}</div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-sm font-black font-mono-num text-slate-900">
                              ₹{Number(exp.amount).toLocaleString('en-IN')}
                            </div>
                            <div className="text-[11px] text-slate-400">{exp.category || 'General'}</div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200/60">
                              <User className="w-3 h-3 text-emerald-600" />
                              <span>{exp.payer}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="font-bold text-slate-900 truncate">
                              {proj ? proj.title : 'General Initiative'}
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                              {proj ? proj.department : (exp.department || 'General')}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{exp.vendor || 'Direct Payee'}</div>
                            <div className="font-mono-num text-[11px] text-slate-500 flex items-center gap-1">
                              <span>{exp.paymentMode || 'UPI'}</span>
                              {exp.utrNumber && (
                                <span className="text-slate-400"> • {exp.utrNumber}</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {exp.proofDataUrl ? (
                              <button
                                onClick={() => onViewProof(exp)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 shadow-2xs"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                                <span>View Proof</span>
                              </button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No proof</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 max-w-xs">
                            {exp.howItHelped ? (
                              <div className="space-y-1">
                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                  {exp.howItHelped}
                                </p>
                                <button
                                  onClick={() => onViewImpact(exp)}
                                  className="text-[11px] font-bold text-slate-800 hover:text-slate-900 underline"
                                >
                                  Read Impact →
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic">No notes</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1">
                            <button
                              onClick={() => onEditExpense(exp)}
                              className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5 inline" />
                            </button>
                            <button
                              onClick={() => onDeleteExpense(exp.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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
