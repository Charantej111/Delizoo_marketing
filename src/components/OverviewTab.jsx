import React, { useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  Coins,
  ArrowRight,
  Eye,
  FileText,
  PieChart,
  Users
} from 'lucide-react';
import { DEFAULT_PARTNERS, SPEND_AREAS, normalizePayerName } from '../services/storage';

export function OverviewTab({
  tasks = [],
  expenses = [],
  partners = DEFAULT_PARTNERS,
  onOpenExpenseModal,
  onOpenPartnerModal,
  onSelectPayerForExpenses,
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
  const capitalUtilization = totalCommittedCapital > 0 ? Math.min(Math.round((totalSpent / totalCommittedCapital) * 100), 100) : 0;

  // Partner Investment and Spend Tracking
  const partnerAnalytics = useMemo(() => {
    return partners.map(p => {
      const pExpenses = expenses.filter(e => {
        const norm = normalizePayerName(e.payer, partners);
        return norm.toLowerCase() === p.name.toLowerCase();
      });

      const spent = pExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const remaining = (Number(p.investment) || 0) - spent;
      const pctSpent = p.investment > 0 ? Math.min(Math.round((spent / p.investment) * 100), 100) : 0;

      // Group by spend area for this partner
      const catMap = {};
      pExpenses.forEach(e => {
        const cat = e.category?.trim() || 'General';
        catMap[cat] = (catMap[cat] || 0) + (Number(e.amount) || 0);
      });
      const topCategories = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2);

      return {
        ...p,
        spent,
        remaining,
        pctSpent,
        txnCount: pExpenses.length,
        topCategories
      };
    });
  }, [partners, expenses]);

  // Spend Area Distribution
  const spendAreaStats = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const area = e.category?.trim() || 'General';
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

  // Recent 5 expenses
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')))
      .slice(0, 6);
  }, [expenses]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Welcome Bar */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Delizoo Kakinada — Capital & Operations
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Tracking ₹{totalCommittedCapital.toLocaleString('en-IN')} founder capital across marketing, rider fleet, restaurant operations, and verified receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenPartnerModal}
            className="px-3.5 py-2 rounded-xl bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-800 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            Manage Capital
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
          >
            + Record Expense
          </button>
        </div>
      </div>

      {/* 3 Core Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Capital Pool */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Total Capital Pool</span>
            <Coins className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono-num text-zinc-900 dark:text-white tracking-tight">
            ₹{totalCommittedCapital.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{partners.length} Founders</span>
            <span>Committed Pool</span>
          </div>
        </div>

        {/* Real Spend */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Real Disbursed Spend</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono-num text-emerald-600 dark:text-emerald-400 tracking-tight">
            ₹{totalSpent.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{totalCommittedCapital > 0 ? `${capitalUtilization}% utilized` : 'No capital pool'}</span>
            <span className="font-mono-num">{expenses.length} bills recorded</span>
          </div>
        </div>

        {/* Available Capital Balance */}
        <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Available Capital Balance</span>
            <Wallet className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono-num tracking-tight ${
            remainingCapitalPool >= 0 ? 'text-zinc-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'
          }`}>
            ₹{remainingCapitalPool.toLocaleString('en-IN')}
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>{remainingCapitalPool >= 0 ? 'Available funds left' : 'Pool exceeded'}</span>
            <span className={`font-semibold ${remainingCapitalPool >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {totalCommittedCapital > 0 ? `${100 - capitalUtilization}% left` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION: 6 Founders Capital Allocation */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Founders Capital Allocation</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Committed pool, disbursed spend, and remaining balance for each partner.
            </p>
          </div>

          <button
            onClick={onOpenPartnerModal}
            className="self-start sm:self-center text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:underline cursor-pointer"
          >
            Edit Allocations →
          </button>
        </div>

        {/* 6 Partner Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partnerAnalytics.map((p) => (
            <div
              key={p.id || p.name}
              className="p-4 rounded-xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800 space-y-3 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
            >
              {/* Partner Name & Role */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight">
                    {p.name}
                  </h3>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{p.role}</p>
                </div>

                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  p.remaining >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                }`}>
                  {p.remaining >= 0 ? `${Math.round((p.remaining / (p.investment || 1)) * 100)}% Available` : 'Exceeded'}
                </span>
              </div>

              {/* Financial Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 block">Committed</span>
                  <span className="text-xs font-bold font-mono-num text-zinc-900 dark:text-white">
                    ₹{p.investment.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 block">Spent</span>
                  <span className="text-xs font-bold font-mono-num text-zinc-900 dark:text-zinc-300">
                    ₹{p.spent.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={`p-2 rounded-lg ${
                  p.remaining >= 0
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-50/70 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                }`}>
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 block">Available</span>
                  <span className="text-xs font-bold font-mono-num">
                    ₹{p.remaining.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      p.remaining < 0 ? 'bg-rose-500' : p.pctSpent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(p.pctSpent, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-mono-num">
                  <span>{p.pctSpent}% spent</span>
                  <span>{p.txnCount} bills paid</span>
                </div>
              </div>

              {/* Top Categories Funded */}
              {p.topCategories.length > 0 ? (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400 truncate max-w-[180px]">
                    {p.topCategories.map(([cat, amt]) => `${cat}: ₹${amt.toLocaleString('en-IN')}`).join(', ')}
                  </span>
                  {onSelectPayerForExpenses && (
                    <button
                      onClick={() => onSelectPayerForExpenses(p.name)}
                      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                    >
                      View Bills →
                    </button>
                  )}
                </div>
              ) : (
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 dark:text-zinc-500">
                  No expenditures recorded yet.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: Spend by Area & Recent Expenditures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Spend by Operational Area */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <PieChart className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Spend by Operational Area</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Marketing, printing, fleet, tech, and ops breakdown</p>
            </div>
          </div>

          {spendAreaStats.length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">
              No expenditures recorded yet.
            </p>
          ) : (
            <div className="space-y-3 pt-1">
              {spendAreaStats.map(c => (
                <div key={c.area} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{c.area}</span>
                    <div className="font-mono-num space-x-1.5">
                      <span className="font-bold text-zinc-900 dark:text-white">₹{c.amount.toLocaleString('en-IN')}</span>
                      <span className="text-zinc-400 dark:text-zinc-500">({c.pct}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenditures Feed */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Recent Expenditures</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Latest transactions with receipts & ROI impact</p>
            </div>
            {expenses.length > 0 && (
              <button
                onClick={() => setActiveTab('expenses')}
                className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>All ({expenses.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recentExpenses.length === 0 ? (
            <p className="text-xs text-zinc-400 py-8 text-center">
              No expenditures recorded yet. Click "+ Record Expense" to log your first payment.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {recentExpenses.map((exp) => {
                const normalizedPayer = normalizePayerName(exp.payer, partners);

                return (
                  <div
                    key={exp.id}
                    className="py-3 flex items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                          {exp.vendor || 'Direct Payee'}
                        </span>
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono-num shrink-0">
                          {exp.date}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">Paid by: {normalizedPayer}</span>
                        {' • '}
                        <span>{exp.category || 'General'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-black font-mono-num text-zinc-900 dark:text-white">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] font-mono-num text-zinc-400 dark:text-zinc-500">
                          {exp.paymentMode || 'UPI'}
                        </div>
                      </div>

                      {exp.proofDataUrl && (
                        <button
                          onClick={() => onViewProof(exp)}
                          className="p-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                          title="View Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {exp.howItHelped && (
                        <button
                          onClick={() => onViewImpact(exp)}
                          className="p-1.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                          title="View Notes & Impact"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
