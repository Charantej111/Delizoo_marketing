import React, { useState, useMemo } from 'react';
import {
  Plus,
  Receipt,
  User,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { EmptyState } from './EmptyState';
import { CustomSelect } from './ui/CustomSelect';

export function ProjectsTab({
  projects,
  tasks,
  expenses,
  onOpenProjectModal,
  onEditProject,
  onDeleteProject,
  onSelectProjectForExpenses,
  searchQuery
}) {
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Dynamically extract departments
  const departments = useMemo(() => {
    const set = new Set();
    projects.forEach(p => { if (p.department) set.add(p.department); });
    return ['All', ...Array.from(set)];
  }, [projects]);

  const statuses = ['All', 'Planning', 'In Progress', 'Completed', 'On Hold'];

  // Calculate live project metrics
  const projectMetrics = useMemo(() => {
    const metrics = {};
    projects.forEach(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id);
      const pExpenses = expenses.filter(e => e.projectId === p.id);
      const totalSpent = pExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
      const completedTasks = pTasks.filter(t => t.completed || t.status === 'Completed').length;
      
      metrics[p.id] = {
        totalSpent,
        expenseCount: pExpenses.length,
        taskCount: pTasks.length,
        completedTasks,
        budgetBurnPct: p.budget > 0 ? Math.min(Math.round((totalSpent / p.budget) * 100), 100) : 0,
        taskProgressPct: pTasks.length > 0 ? Math.round((completedTasks / pTasks.length) * 100) : (p.progress || 0)
      };
    });
    return metrics;
  }, [projects, tasks, expenses]);

  // Dynamic filter
  const filteredProjects = projects.filter(p => {
    if (selectedDept !== 'All' && p.department !== selectedDept) return false;
    if (selectedStatus !== 'All' && p.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchLead = (p.lead || '').toLowerCase().includes(q);
      const matchDept = (p.department || '').toLowerCase().includes(q);
    if (!matchTitle && !matchDesc && !matchLead && !matchDept) return false;
    }
    return true;
  });

  // Sort projects
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const ma = projectMetrics[a.id] || { totalSpent: 0, taskProgressPct: 0 };
    const mb = projectMetrics[b.id] || { totalSpent: 0, taskProgressPct: 0 };
    if (sortBy === 'budget-desc') return (Number(b.budget) || 0) - (Number(a.budget) || 0);
    if (sortBy === 'budget-asc') return (Number(a.budget) || 0) - (Number(b.budget) || 0);
    if (sortBy === 'spent-desc') return mb.totalSpent - ma.totalSpent;
    if (sortBy === 'progress-desc') return mb.taskProgressPct - ma.taskProgressPct;
    if (sortBy === 'title-asc') return (a.title || '').localeCompare(b.title || '');
    return 0;
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Header and Filter Control Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Project Initiatives
            </h2>
            <p className="text-xs text-slate-500">
              {projects.length === 0
                ? 'Create campaigns and projects to monitor spending and milestones.'
                : `Tracking ${filteredProjects.length} of ${projects.length} initiatives.`}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sort Switcher */}
            {projects.length > 1 && (
              <CustomSelect
                value={sortBy}
                onChange={setSortBy}
                size="sm"
                className="w-38"
                options={[
                  { value: 'default', label: 'Default Order' },
                  { value: 'budget-desc', label: 'Budget (Highest)' },
                  { value: 'budget-asc', label: 'Budget (Lowest)' },
                  { value: 'spent-desc', label: 'Spend (Highest)' },
                  { value: 'progress-desc', label: 'Progress (Highest)' },
                  { value: 'title-asc', label: 'Title (A-Z)' }
                ]}
              />
            )}

            {/* View Switcher */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Table
              </button>
            </div>

            <button
              onClick={onOpenProjectModal}
              className="px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        {projects.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-3 border-t border-slate-200/50">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Dept:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {departments.map(dept => (
                <button
                  key={dept}
                  onClick={() => setSelectedDept(dept)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedDept === dept
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white/70 border border-slate-200/70 text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            <span className="text-[11px] font-bold text-slate-400 mr-1 hidden sm:inline">Status:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              {statuses.map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedStatus === st
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white/70 border border-slate-200/70 text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyState
          type="projects"
          title="No projects created yet"
          description="Projects organize your marketing campaigns, restaurant merchant onboarding, app releases, and operational expenses."
          actionText="Create First Project"
          onAction={onOpenProjectModal}
        />
      ) : sortedProjects.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-12">
          No projects match the selected filter criteria.
        </p>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {sortedProjects.map(proj => {
            const m = projectMetrics[proj.id] || { totalSpent: 0, expenseCount: 0, taskCount: 0, completedTasks: 0, budgetBurnPct: 0, taskProgressPct: 0 };
            const isOverBudget = proj.budget > 0 && m.totalSpent > proj.budget;

            return (
              <div
                key={proj.id}
                className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200/60">
                      {proj.department || 'General'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.priority === 'Urgent'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : proj.priority === 'High'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {proj.priority || 'Normal'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        proj.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : proj.status === 'In Progress'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {proj.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1">
                    {proj.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {proj.description || 'No description provided.'}
                  </p>

                  {/* Lead & Timeline */}
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-4 pb-3 border-b border-slate-200/50">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{proj.lead || 'Unassigned'}</span>
                    </div>
                    <div className="font-mono-num text-slate-400 text-[11px]">
                      {proj.endDate ? `Due: ${proj.endDate}` : 'Ongoing'}
                    </div>
                  </div>

                  {/* Budget Progress Gauge */}
                  <div className="space-y-1.5 mb-3.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-500">Budget Spent</span>
                      <span className={`font-mono-num font-bold ${isOverBudget ? 'text-rose-600' : 'text-slate-900'}`}>
                        ₹{m.totalSpent.toLocaleString('en-IN')} / ₹{Number(proj.budget || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget ? 'bg-rose-500' : m.budgetBurnPct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${m.budgetBurnPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks Progress Gauge */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-500">Milestones Done</span>
                      <span className="font-mono-num font-bold text-slate-800">
                        {m.completedTasks} / {m.taskCount} ({m.taskProgressPct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${m.taskProgressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-200/50 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectProjectForExpenses(proj.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
                  >
                    <Receipt className="w-3.5 h-3.5 text-slate-600" />
                    <span>Ledger ({m.expenseCount})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditProject(proj)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteProject(proj.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Project Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Lead</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Actual Spend</th>
                  <th className="py-3 px-4">Milestones</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedProjects.map(proj => {
                  const m = projectMetrics[proj.id] || { totalSpent: 0, expenseCount: 0, taskCount: 0, completedTasks: 0 };
                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{proj.title}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200/60">
                          {proj.department || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          proj.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : proj.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {proj.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{proj.lead || '—'}</td>
                      <td className="py-3.5 px-4 font-mono-num font-bold text-slate-900">
                        ₹{Number(proj.budget || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num font-bold text-emerald-600">
                        ₹{m.totalSpent.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-mono-num text-slate-500">
                        {m.completedTasks} / {m.taskCount}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => onSelectProjectForExpenses(proj.id)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold"
                        >
                          Ledger
                        </button>
                        <button
                          onClick={() => onEditProject(proj)}
                          className="px-2 py-1 rounded-lg text-slate-500 hover:bg-slate-100 font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDeleteProject(proj.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
