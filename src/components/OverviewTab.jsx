import React, { useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  Receipt,
  FileCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Eye,
  FileText
} from 'lucide-react';
import { DEFAULT_PARTNERS, normalizePayerName } from '../services/storage';

export function OverviewTab({
  tasks = [],
  expenses = [],
  partners = DEFAULT_PARTNERS,
  spendAreas = [],
  onOpenExpenseModal,
  onOpenPartnerModal,
  onSelectPayerForExpenses,
  onSelectSpendAreaForExpenses,
  onViewProof,
  onViewImpact,
  setActiveTab
}) {
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

  // Task Summary
  const taskSummary = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return { total: 0, completed: 0, inProgress: 0, toDo: 0, pct: 0 };
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress' || t.status === 'In Review').length;
    const toDo = tasks.filter(t => t.status === 'To Do').length;
    const pct = Math.round((completed / total) * 100);
    return { total, completed, inProgress, toDo, pct };
  }, [tasks]);

  // Recent 6 expenses
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')))
      .slice(0, 6);
  }, [expenses]);

  return (
    <div className="space-y-6 pb-12">
      {/* Clean Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight">
            Financial & Operational Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time expenditure tracking and partner budget utilization for Delizoo Kakinada.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenPartnerModal}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer"
          >
            Adjust Allocations
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            + Record Expense
          </button>
        </div>
      </div>

      {/* 4 Core Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Committed Capital */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Total Allocated Budget
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-num text-zinc-950 dark:text-white tracking-tight">
            ₹{totalCommittedCapital.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {partners.length} Founding Partners
          </div>
        </div>

        {/* Real Disbursed Spend */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Total Disbursed
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-num text-zinc-950 dark:text-white tracking-tight">
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {capitalUtilization}% of committed pool
          </div>
        </div>

        {/* Available Balance */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Remaining Balance
          </div>
          <div className={`text-2xl sm:text-3xl font-bold font-mono-num tracking-tight ${
            remainingCapitalPool >= 0 ? 'text-zinc-950 dark:text-white' : 'text-rose-600 dark:text-rose-400'
          }`}>
            ₹{remainingCapitalPool.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {totalCommittedCapital > 0 ? `${(100 - capitalUtilization).toFixed(1)}% liquid reserve` : '—'}
          </div>
        </div>

        {/* Receipts Verified */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
            Receipts Attached
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono-num text-zinc-950 dark:text-white tracking-tight">
            {proofCount} / {expenses.length}
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {expenses.length > 0 ? `${Math.round((proofCount / expenses.length) * 100)}% verified with proofs` : 'No expenses logged'}
          </div>
        </div>
      </div>

      {/* SECTION: Partner Budget Allocations */}
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-950 dark:text-white">
              Partner Capital & Budget Allocations
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Live tracking of each partner's assigned capital, disbursed expenditure, and remaining balance.
            </p>
          </div>
          <button
            onClick={onOpenPartnerModal}
            className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
          >
            Manage Pool →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4 font-mono-num">Allocated Budget</th>
                <th className="py-3 px-4 font-mono-num">Disbursed Spend</th>
                <th className="py-3 px-4 font-mono-num">Remaining Balance</th>
                <th className="py-3 px-4 w-44">Utilization</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {partnerAnalytics.map((p) => (
                <tr key={p.id || p.name} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-bold text-[11px] text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                        {p.initials}
                      </div>
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                          {p.name}
                        </div>
                        {p.email && (
                          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono-num">
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
                            p.remaining < 0 ? 'bg-rose-500' : 'bg-zinc-900 dark:bg-zinc-300'
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Spend Breakdown & Recent Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Spend by Operational Area */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
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
            <div className="space-y-3 pt-1">
              {spendAreaStats.map(item => (
                <div
                  key={item.area}
                  onClick={() => onSelectSpendAreaForExpenses && onSelectSpendAreaForExpenses(item.area)}
                  className="space-y-1.5 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate flex-1">
                      {item.area}
                    </span>
                    <div className="font-mono-num space-x-2 text-right shrink-0">
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500 text-[11px]">
                        ({item.pct}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-zinc-800 dark:bg-zinc-300 transition-all"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenditures */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Recent Expenditures
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Latest transactions logged to the ledger.
              </p>
            </div>
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('expenses')}
                className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
              >
                View all ({expenses.length}) →
              </button>
            )}
          </div>

          {recentExpenses.length === 0 ? (
            <p className="text-xs text-zinc-400 py-6 text-center">
              No transactions recorded yet.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentExpenses.map(e => (
                <div key={e.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-zinc-900 dark:text-white truncate">
                      {e.vendor || e.category || 'General Expense'}
                    </div>
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-2 mt-0.5">
                      <span>{e.date}</span>
                      <span>•</span>
                      <span>{normalizePayerName(e.payer)}</span>
                      <span>•</span>
                      <span className="truncate">{e.spendArea || e.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold font-mono-num text-zinc-900 dark:text-white text-xs">
                      ₹{Number(e.amount).toLocaleString('en-IN')}
                    </span>
                    {e.proofDataUrl && onViewProof && (
                      <button
                        onClick={() => onViewProof(e)}
                        className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
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
