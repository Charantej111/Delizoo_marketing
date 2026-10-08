import React, { useState, useMemo } from 'react';
import { Plus, User, Trash2, CheckSquare } from 'lucide-react';
import { EmptyState } from './EmptyState';

export function KanbanTab({
  tasks,
  projects,
  onSaveTask,
  onDeleteTask,
  onOpenTaskModal,
  searchQuery
}) {
  const [filterProject, setFilterProject] = useState('All');
  const columns = [
    { id: 'To Do', label: 'To Do / Backlog', color: 'bg-slate-400' },
    { id: 'In Progress', label: 'In Progress', color: 'bg-blue-500' },
    { id: 'In Review', label: 'In Review', color: 'bg-indigo-500' },
    { id: 'Completed', label: 'Completed', color: 'bg-emerald-500' }
  ];

  const projMap = useMemo(() => {
    const map = {};
    projects.forEach(p => { map[p.id] = p; });
    return map;
  }, [projects]);

  // Dynamic filter
  const filteredTasks = tasks.filter(t => {
    if (filterProject !== 'All' && t.projectId !== filterProject) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchAssignee = (t.assignee || '').toLowerCase().includes(q);
      const matchProj = (projMap[t.projectId]?.title || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchProj) return false;
    }
    return true;
  });

  const handleStatusChange = (task, newStatus) => {
    const updated = {
      ...task,
      status: newStatus,
      completed: newStatus === 'Completed'
    };
    onSaveTask(updated);
  };

  const handleToggleChecklist = (task, itemIndex) => {
    const updated = {
      ...task,
      completedItems: task.completedItems || []
    };
    if (updated.completedItems.includes(itemIndex)) {
      updated.completedItems = updated.completedItems.filter(i => i !== itemIndex);
    } else {
      updated.completedItems.push(itemIndex);
    }
    onSaveTask(updated);
  };

  return (
    <div className="space-y-5 sm:space-y-6 pb-12">
      {/* Header and Project Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Team Task Board
          </h2>
          <p className="text-xs text-slate-500">
            Actionable workflow board for operational, marketing, and merchant milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">Project:</span>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="text-xs glass-input rounded-xl px-2.5 py-1.5 font-medium text-slate-800 outline-none"
              >
                <option value="All">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={onOpenTaskModal}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          type="tasks"
          title="No tasks on the board"
          description="Plan and organize tasks across your campaigns, flyer distribution runs, and merchant onboarding."
          actionText="Create First Task"
          onAction={onOpenTaskModal}
        />
      ) : (
        /* Kanban Columns Grid - Responsive Horizontal Scroll on Mobile */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map(col => {
            const colTasks = filteredTasks.filter(t => (t.status || 'To Do') === col.id);

            return (
              <div
                key={col.id}
                className="glass-panel rounded-2xl p-3.5 sm:p-4 space-y-3 min-h-[440px] flex flex-col"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/50">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {col.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold font-mono-num border border-slate-200/70">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400">
                      Empty column
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const proj = projMap[task.projectId];
                      const completedItems = task.completedItems || [];
                      const totalItems = (task.checklist || []).length;

                      return (
                        <div
                          key={task.id}
                          className="bg-white/80 hover:bg-white border border-slate-200/70 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all space-y-2.5"
                        >
                          {/* Tags */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60 truncate max-w-[140px]">
                              {proj ? proj.department : 'General'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              task.priority === 'Urgent'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : task.priority === 'High'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {task.priority || 'Normal'}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {task.title}
                          </h4>
                          {proj && (
                            <p className="text-[11px] text-slate-400 truncate">
                              ↳ {proj.title}
                            </p>
                          )}

                          {/* Sub-task Checklists */}
                          {totalItems > 0 && (
                            <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                              <div className="text-[10px] font-semibold text-slate-400 flex justify-between">
                                <span>Checklist:</span>
                                <span className="font-mono-num">{completedItems.length}/{totalItems}</span>
                              </div>
                              {task.checklist.map((item, idx) => {
                                const isChecked = completedItems.includes(idx);
                                return (
                                  <div
                                    key={idx}
                                    onClick={() => handleToggleChecklist(task, idx)}
                                    className="flex items-start gap-1.5 text-[11px] cursor-pointer text-slate-600 hover:text-slate-900"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className={isChecked ? 'line-through text-slate-300' : ''}>
                                      {item}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Assignee & Due Date */}
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 text-slate-500">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span className="font-semibold text-slate-700">{task.assignee || 'Unassigned'}</span>
                            </div>
                            {task.dueDate && (
                              <span className="font-mono-num text-slate-400">
                                {task.dueDate}
                              </span>
                            )}
                          </div>

                          {/* Move Column Selector & Delete */}
                          <div className="flex items-center justify-between pt-1 gap-1">
                            <select
                              value={task.status || 'To Do'}
                              onChange={(e) => handleStatusChange(task, e.target.value)}
                              className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 text-slate-600 outline-none"
                            >
                              {columns.map(c => (
                                <option key={c.id} value={c.id}>Move: {c.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
