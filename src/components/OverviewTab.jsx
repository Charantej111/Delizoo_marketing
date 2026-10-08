import React from 'react';
import {
  FolderKanban,
  Receipt,
  IndianRupee,
  CheckCircle2,
  TrendingUp,
  Eye,
  ArrowRight,
  Wallet,
  Activity
} from 'lucide-react';
import { EmptyState } from './EmptyState';

export function OverviewTab({
  projects,
  tasks,
  expenses,
  onOpenExpenseModal,
  onOpenProjectModal,
  onViewProof,
  onViewImpact,
  setActiveTab
}) {
  // Dynamic aggregations
  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
  const totalSpent = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetUtilization = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed || t.status === 'Completed').length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Department Breakdown
  const deptStats = {};
  projects.forEach(p => {
    const dept = p.department || 'General';
    if (!deptStats[dept]) deptStats[dept] = { budget: 0, spent: 0, count: 0 };
    deptStats[dept].budget += Number(p.budget) || 0;
    deptStats[dept].count += 1;
  });

  expenses.forEach(e => {
    const proj = projects.find(p => p.id === e.projectId);
    const dept = proj ? proj.department : (e.department || 'General');
    if (!deptStats[dept]) deptStats[dept] = { budget: 0, spent: 0, count: 0 };
    deptStats[dept].spent += Number(e.amount) || 0;
  });

  // Funding contributors ("Who gave the amount")
  const payerStats = {};
  expenses.forEach(e => {
    const payer = e.payer?.trim() || 'Unspecified';
    if (!payerStats[payer]) payerStats[payer] = { amount: 0, count: 0 };
    payerStats[payer].amount += Number(e.amount) || 0;
    payerStats[payer].count += 1;
  });

  const sortedPayers = Object.entries(payerStats).sort((a, b) => b[1].amount - a[1].amount);

  // Recent 5 expenses
  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date + ' ' + (b.time || '00:00')) - new Date(a.date + ' ' + (a.time || '00:00')))
    .slice(0, 5);

  const hasAnyData = projects.length > 0 || expenses.length > 0;

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Top Welcome Glass Card */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Operations & Budget Command Center
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/80">
              LIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time project tracking, cash flow accountability, and verified proofs for Delizoo Kakinada.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setActiveTab('expenses')}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 border border-slate-200/80 text-xs font-bold transition-all shadow-2xs"
          >
            Full Ledger
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
          >
            + Record Expense
          </button>
        </div>
      </div>

      {/* 4 Frosted Glass Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Budget */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Allocated Budget</span>
              <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <FolderKanban className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-slate-900">
              ₹{totalBudget.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500 flex items-center justify-between">
            <span>{projects.length} Initiatives</span>
            <span className="font-semibold text-slate-800">{projects.length > 0 ? 'Active' : 'Empty'}</span>
          </div>
        </div>

        {/* Real Spend */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Real Spend</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                <IndianRupee className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-emerald-600">
              ₹{totalSpent.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500 flex items-center justify-between">
            <span>{totalBudget > 0 ? `${budgetUtilization}% utilized` : 'No budget'}</span>
            <span className="font-semibold text-slate-700">{expenses.length} bills</span>
          </div>
        </div>

        {/* Remaining Surplus */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Remaining Balance</span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-black font-mono-num ${remainingBudget >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              ₹{remainingBudget.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500 flex items-center justify-between">
            <span>{remainingBudget >= 0 ? 'Surplus funds' : 'Over budget'}</span>
            <span className={`font-semibold ${remainingBudget >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalBudget > 0 ? `${100 - budgetUtilization}% left` : '—'}
            </span>
          </div>
        </div>

        {/* Task Velocity */}
        <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Milestones Done</span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono-num text-slate-900">
              {taskProgress}%
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-500 flex items-center justify-between">
            <span>{completedTasks} of {totalTasks} finished</span>
            <span className="font-semibold text-slate-700">{totalTasks - completedTasks} open</span>
          </div>
        </div>
      </div>

      {!hasAnyData ? (
        <EmptyState
          type="projects"
          title="Clean Workspace Ready"
          description="Track your team's initiatives, rider kit procurements, student flyer distribution, and verified payment proofs."
          actionText="Create First Project"
          onAction={onOpenProjectModal}
        />
      ) : (
        <>
          {/* Department Breakdown & Funding Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Department Breakdown */}
            <div className="glass-panel rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Spend by Department</h3>
                  <p className="text-[11px] text-slate-500">Live comparison against allocated budget</p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {Object.keys(deptStats).length} Depts
                </span>
              </div>

              {Object.keys(deptStats).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No department activity yet.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(deptStats).map(([dept, stat]) => {
                    const pct = stat.budget > 0 ? Math.min(Math.round((stat.spent / stat.budget) * 100), 100) : 0;
                    return (
                      <div key={dept} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">{dept}</span>
                          <div className="font-mono-num space-x-1.5">
                            <span className="font-bold text-slate-900">₹{stat.spent.toLocaleString('en-IN')}</span>
                            <span className="text-slate-400">/ ₹{stat.budget.toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct > 90 ? 'bg-rose-500' : pct > 60 ? 'bg-blue-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Funding Sources ("Who gave the amount") */}
            <div className="glass-panel rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Funding Sources (Who Paid)</h3>
                  <p className="text-[11px] text-slate-500">Real-time ledger of who funded each expenditure</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80">
                  {sortedPayers.length} Sources
                </span>
              </div>

              {sortedPayers.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  No payers recorded yet. Add an expense to see contributor analytics.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {sortedPayers.map(([payer, data]) => {
                    const share = totalSpent > 0 ? Math.round((data.amount / totalSpent) * 100) : 0;
                    return (
                      <div
                        key={payer}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/70 border border-slate-200/70 hover:bg-white transition-all shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-extrabold text-slate-700">
                            {payer.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-slate-900">{payer}</p>
                            <p className="text-[11px] text-slate-500">{data.count} payment{data.count > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-mono-num font-extrabold text-slate-900">
                            ₹{data.amount.toLocaleString('en-IN')}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium">{share}% of total</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenditures Feed */}
          <div className="glass-panel rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Expenditures & Proofs</h3>
                <p className="text-[11px] text-slate-500">Latest transactions with proof verification and ROI impact notes</p>
              </div>
              {expenses.length > 0 && (
                <button
                  onClick={() => setActiveTab('expenses')}
                  className="text-xs font-bold text-slate-800 hover:text-slate-900 flex items-center gap-1 hover:underline"
                >
                  <span>See all ({expenses.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {recentExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No expenditures recorded yet. Click "+ Record Expense" to log your first payment.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentExpenses.map((exp) => {
                  const proj = projects.find(p => p.id === exp.projectId);
                  return (
                    <div
                      key={exp.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-mono-num text-xs font-bold shrink-0 mt-0.5">
                          ₹
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {exp.vendor || 'Direct Payee'}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 font-medium">
                              {proj ? proj.department : (exp.department || 'General')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono-num">{exp.date}</span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            <span className="font-semibold text-emerald-700">Paid by: {exp.payer}</span>
                            {' • '}
                            <span className="text-slate-500">{proj ? proj.title : 'General Initiative'}</span>
                          </p>
                          {exp.howItHelped && (
                            <p className="text-xs text-slate-500 italic mt-1 line-clamp-1 max-w-xl">
                              “{exp.howItHelped}”
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-black font-mono-num text-slate-900">
                            ₹{Number(exp.amount).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] font-mono-num text-slate-400">
                            {exp.paymentMode || 'UPI'}
                          </div>
                        </div>

                        {exp.proofDataUrl && (
                          <button
                            onClick={() => onViewProof(exp)}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 flex items-center gap-1 shadow-2xs transition-all"
                            title="Inspect Proof"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-600" />
                            <span>Proof</span>
                          </button>
                        )}

                        {exp.howItHelped && (
                          <button
                            onClick={() => onViewImpact(exp)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-slate-800 transition-all"
                            title="View Impact"
                          >
                            Impact
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
