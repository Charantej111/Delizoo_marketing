import React, { useMemo, useState } from 'react';
import {
  Wallet,
  TrendingUp,
  Receipt,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  FileText,
  Compass,
  LayoutGrid,
  ListFilter,
  Building2,
  ChevronRight
} from 'lucide-react';
import { DEFAULT_PARTNERS, normalizePayerName } from '../services/storage';

export function OverviewTab({
  tasks = [],
  expenses = [],
  partners = DEFAULT_PARTNERS,
  spendAreas = [],
  onOpenExpenseModal,
  onOpenPartnerModal,
  onOpenTour,
  onSelectPayerForExpenses,
  onSelectSpendAreaForExpenses,
  onViewProof,
  onViewImpact,
  setActiveTab,
  currentUser
}) {
  const [partnerViewMode, setPartnerViewMode] = useState('cards');

  // Financial aggregations
  const totalSpent = useMemo(() => {
    return expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const totalCommittedCapital = useMemo(() => {
    return partners.reduce((acc, p) => acc + (Number(p.investment) || 0), 0);
  }, [partners]);

  const remainingCapitalPool = totalCommittedCapital - totalSpent;
  const capitalUtilization = totalCommittedCapital > 0
    ? Math.round((totalSpent / totalCommittedCapital) * 1000) / 10
    : 0;

  const proofCount = useMemo(() => {
    return expenses.filter(e => !!e.proofDataUrl).length;
  }, [expenses]);

  // Partner Investment and Spend Tracking (strictly respecting exact database allocations)
  const partnerAnalytics = useMemo(() => {
    return partners.map(p => {
      const pExpenses = expenses.filter(e => {
        const norm = normalizePayerName(e.payer, partners);
        return norm.toLowerCase() === p.name.toLowerCase();
      });

      const spent = pExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const allocated = Number(p.investment) || 0;
      const remaining = allocated - spent;
      const pctSpent = allocated > 0 ? Math.min(Math.round((spent / allocated) * 100), 100) : 0;

      const parts = p.name.trim().split(/\s+/);
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : p.name.slice(0, 2).toUpperCase();

      return {
        ...p,
        initials,
        allocated,
        spent,
        remaining,
        pctSpent,
        txnCount: pExpenses.length
      };
    });
  }, [partners, expenses]);

  // Spend Area Distribution
  const spendAreaStats = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const area = e.spendArea || e.category?.trim() || 'General';
      if (!map[area]) map[area] = { amount: 0, count: 0 };
      map[area].amount += Number(e.amount) || 0;
      map[area].count += 1;
    });

    return Object.entries(map)
      .map(([area, d]) => ({
        area,
        amount: d.amount,
        count: d.count,
        pct: totalSpent > 0 ? Math.round((d.amount / totalSpent) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalSpent]);

  // Recent 6 expenses
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')))
      .slice(0, 6);
  }, [expenses]);

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Page Header with breathing room */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
            Financial & Operational Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time expenditure tracking and partner budget utilization for Delizoo Kakinada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(!currentUser || currentUser.isLead) && (
            <button
              onClick={onOpenPartnerModal}
              className="px-3.5 py-1.5 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
            >
              Adjust Allocations
            </button>
          )}
          <button
            onClick={onOpenExpenseModal}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            + Record Expense
          </button>
        </div>
      </div>

      {/* 4 Core Financial Metrics - Elevated Fintech Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Committed Capital */}
        <div className="card-modern card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Total Capital Pool
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono-num text-zinc-950 dark:text-white tracking-tight">
            ₹{totalCommittedCapital.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {partners.length} Founding Partners
            </span>
          </div>
        </div>

        {/* Real Disbursed Spend */}
        <div className="card-modern card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Disbursed Spend
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono-num text-zinc-950 dark:text-white tracking-tight">
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
              {capitalUtilization}% utilized
            </span>
            <span className="text-xs text-zinc-400 font-mono-num">
              ({expenses.length} bills)
            </span>
          </div>
        </div>

        {/* Available Balance */}
        <div className="card-modern card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Remaining Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-2xl sm:text-3xl font-bold font-mono-num tracking-tight ${
            remainingCapitalPool >= 0 ? 'text-zinc-950 dark:text-white' : 'text-rose-600 dark:text-rose-400'
          }`}>
            ₹{remainingCapitalPool.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
              remainingCapitalPool >= 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
            }`}>
              {totalCommittedCapital > 0 ? `${(100 - capitalUtilization).toFixed(1)}% liquid reserve` : '—'}
            </span>
          </div>
        </div>

        {/* Receipts Verified */}
        <div className="card-modern card-hover p-4 sm:p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Proof Verification
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-bold font-mono-num text-zinc-950 dark:text-white tracking-tight">
            {proofCount} <span className="text-lg text-zinc-400 font-normal">/ {expenses.length}</span>
          </div>
          <div className="mt-2 text-xs text-zinc-400">
            Receipts attached
          </div>
        </div>
      </div>

      {/* SECTION: Partner Budget Allocations */}
      <div className="card-modern rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
              Founder Capital & Allocations
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Assigned capital pool, disbursed expenditure, and real-time liquid balance for each founder.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* View Switcher: Cards vs Table */}
            <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/60">
              <button
                type="button"
                onClick={() => setPartnerViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  partnerViewMode === 'cards'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setPartnerViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1.5 ${
                  partnerViewMode === 'table'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
                title="Table View"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {(!currentUser || currentUser.isLead) && (
              <button
                onClick={onOpenPartnerModal}
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer px-2 py-1"
              >
                Manage Pool →
              </button>
            )}
          </div>
        </div>

        {/* View Mode: Cards */}
        {partnerViewMode === 'cards' ? (
          <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partnerAnalytics.map((p) => {
              const isCurrentUser = currentUser && (
                (currentUser.email && p.email && currentUser.email.toLowerCase() === p.email.toLowerCase()) ||
                currentUser.name.toLowerCase() === p.name.toLowerCase()
              );

              return (
                <div
                  key={p.id || p.name}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrentUser
                      ? 'border-zinc-900/30 dark:border-zinc-500/40 bg-zinc-50/60 dark:bg-zinc-800/40'
                      : 'border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 border border-zinc-200/80 dark:border-zinc-700 font-bold text-xs text-zinc-800 dark:text-zinc-200 flex items-center justify-center shrink-0">
                        {p.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-900 dark:text-white text-xs truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-zinc-950 dark:bg-white text-white dark:text-zinc-950">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">
                          {p.role}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono-num font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shrink-0">
                      {p.pctSpent}%
                    </span>
                  </div>

                  {/* Balance Display */}
                  <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/70">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-zinc-500">Liquid Balance</span>
                      <span className={`text-base font-bold font-mono-num ${
                        p.remaining >= 0 ? 'text-zinc-950 dark:text-white' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        ₹{p.remaining.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          p.remaining < 0 
                            ? 'bg-rose-500' 
                            : p.pctSpent > 80 
                              ? 'bg-amber-500' 
                              : 'bg-zinc-950 dark:bg-white'
                        }`}
                        style={{ width: `${Math.min(p.pctSpent, 100)}%` }}
                      />
                    </div>

                    {/* Meta: Allocated vs Spent */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono-num mt-2">
                      <span>Pool: ₹{p.allocated.toLocaleString('en-IN')}</span>
                      <span>Spent: ₹{p.spent.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {onSelectPayerForExpenses && p.txnCount > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/70 flex justify-end">
                      <button
                        onClick={() => onSelectPayerForExpenses(p.name)}
                        className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>View {p.txnCount} bills</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode: Compact Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Founder</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 font-mono-num">Allocated Pool</th>
                  <th className="py-3 px-4 font-mono-num">Disbursed Spend</th>
                  <th className="py-3 px-4 font-mono-num">Remaining Balance</th>
                  <th className="py-3 px-4 w-44">Utilization</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {partnerAnalytics.map((p) => {
                  const isCurrentUser = currentUser && (
                    (currentUser.email && p.email && currentUser.email.toLowerCase() === p.email.toLowerCase()) ||
                    currentUser.name.toLowerCase() === p.name.toLowerCase()
                  );

                  return (
                    <tr key={p.id || p.name} className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors ${isCurrentUser ? 'bg-zinc-50/70 dark:bg-zinc-800/20' : ''}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-[11px] text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                            {p.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-white text-xs flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-950">
                                  You
                                </span>
                              )}
                            </div>
                            {p.email && (
                              <div className="text-[11px] text-zinc-400 font-mono-num">
                                {p.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-600 dark:text-zinc-300 text-xs">
                        {p.role}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num font-semibold text-zinc-900 dark:text-white text-xs">
                        ₹{p.allocated.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-zinc-700 dark:text-zinc-300 text-xs">
                        ₹{p.spent.toLocaleString('en-IN')}
                        {p.txnCount > 0 && (
                          <span className="text-[11px] text-zinc-400 ml-1">({p.txnCount})</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num font-semibold text-xs">
                        <span className={p.remaining >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}>
                          ₹{p.remaining.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono-num text-zinc-500 dark:text-zinc-400">
                            <span>{p.pctSpent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                p.remaining < 0 ? 'bg-rose-500' : 'bg-zinc-950 dark:bg-white'
                              }`}
                              style={{ width: `${Math.min(p.pctSpent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {onSelectPayerForExpenses && p.txnCount > 0 ? (
                          <button
                            onClick={() => onSelectPayerForExpenses(p.name)}
                            className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:underline cursor-pointer"
                          >
                            View Bills
                          </button>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Grid: Spend Breakdown & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Spend by Operational Area */}
        <div className="card-modern p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Spend by Operational Area
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Expenditures grouped by operational channels.
              </p>
            </div>
          </div>

          {spendAreaStats.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">
              No expenditures recorded yet.
            </p>
          ) : (
            <div className="space-y-2.5 pt-1">
              {spendAreaStats.map(item => (
                <div
                  key={item.area}
                  onClick={() => onSelectSpendAreaForExpenses && onSelectSpendAreaForExpenses(item.area)}
                  className="space-y-1.5 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate flex-1">
                      {item.area}
                    </span>
                    <div className="font-mono-num space-x-2 text-right shrink-0">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-zinc-400 text-[11px]">
                        ({item.pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-950 dark:bg-zinc-300 transition-all duration-300"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenditures */}
        <div className="card-modern p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Recent Transactions
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Latest bills logged to the ledger.
              </p>
            </div>
            {setActiveTab && (
              <a
                href="/expenses"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('expenses');
                }}
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer no-underline inline-flex items-center gap-1"
              >
                <span>View all ({expenses.length})</span>
                <ChevronRight className="w-3 h-3" />
              </a>
            )}
          </div>

          {recentExpenses.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">
              No transactions recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {recentExpenses.map(e => (
                <div key={e.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-zinc-900 dark:text-white truncate">
                      {e.vendor || e.category || 'General Expense'}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span>{e.date}</span>
                      <span>•</span>
                      <span>{normalizePayerName(e.payer)}</span>
                      <span>•</span>
                      <span className="truncate">{e.spendArea || e.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="font-bold font-mono-num text-zinc-900 dark:text-white text-xs">
                      ₹{Number(e.amount).toLocaleString('en-IN')}
                    </span>
                    {e.proofDataUrl && onViewProof && (
                      <button
                        onClick={() => onViewProof(e)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        title="View Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
