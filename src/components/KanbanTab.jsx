import React, { useState, useMemo } from 'react';
import { Plus, User, Trash2, CheckSquare } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { CustomSelect } from './ui/CustomSelect';

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
    { id: 'To Do', label: 'To Do / Backlog', color: 'bg-zinc-400 dark:bg-zinc-500' },
    { id: 'In Progress', label: 'In Progress', color: 'bg-zinc-700 dark:bg-zinc-300' },
    { id: 'In Review', label: 'In Review', color: 'bg-zinc-500 dark:bg-zinc-400' },
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
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
            Team Task Board
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Actionable workflow board for operational, marketing, and merchant milestones.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Project:</span>
              <CustomSelect
                value={filterProject}
                onChange={setFilterProject}
                size="sm"
                className="w-44"
                searchable={projects.length > 5}
                options={[
                  { value: 'All', label: 'All Projects' },
                  ...projects.map(p => ({ value: p.id, label: p.title }))
                ]}
              />
            </div>
          )}

          <button
            onClick={onOpenTaskModal}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
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
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/50 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                      {col.label}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[11px] font-bold font-mono-num border border-zinc-200/70 dark:border-zinc-700">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1">
                  {colTasks.length === 0 ? (
                    <div className="h-24 flex items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-[11px] text-zinc-400 dark:text-zinc-500">
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
                          className="bg-white/80 dark:bg-zinc-900/90 hover:bg-white dark:hover:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-800 rounded-xl p-3.5 shadow-2xs hover:shadow-sm transition-all space-y-2.5"
                        >
                          {/* Tags */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-600 truncate max-w-[140px]">
                              {proj ? proj.department : 'General'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              task.priority === 'Urgent'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                                : task.priority === 'High'
                                ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-600'
                                : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600'
                            }`}>
                              {task.priority || 'Normal'}
                            </span>
                          </div>

                          {/* Title */}
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-snug">
                            {task.title}
                          </h4>
                          {proj && (
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                              ↳ {proj.title}
                            </p>
                          )}

                          {/* Sub-task Checklists */}
                          {totalItems > 0 && (
                            <div className="space-y-1.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-700/70">
                              <div className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 flex justify-between">
                                <span>Checklist:</span>
                                <span className="font-mono-num">{completedItems.length}/{totalItems}</span>
                              </div>
                              {task.checklist.map((item, idx) => {
                                const isChecked = completedItems.includes(idx);
                                return (
                                   <div
                                     key={idx}
                                     onClick={() => handleToggleChecklist(task, idx)}
                                     className="flex items-start gap-1.5 text-[11px] cursor-pointer text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                                   >
                                     <input
                                       type="checkbox"
                                       checked={isChecked}
                                       onChange={() => {}}
                                       className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                     />
                                     <span className={isChecked ? 'line-through text-zinc-300 dark:text-zinc-600' : ''}>
                                       {item}
                                     </span>
                                   </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Assignee & Due Date */}
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-700/70 text-zinc-500 dark:text-zinc-400">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{task.assignee || 'Unassigned'}</span>
                            </div>
                            {task.dueDate && (
                              <span className="font-mono-num text-zinc-400 dark:text-zinc-500">
                                {task.dueDate}
                              </span>
                            )}
                          </div>

                          {/* Move Column Selector & Delete */}
                          <div className="flex items-center justify-between pt-1 gap-1.5">
                            <CustomSelect
                              value={task.status || 'To Do'}
                              onChange={(newStatus) => handleStatusChange(task, newStatus)}
                              size="sm"
                              className="flex-1"
                              options={columns.map(c => ({
                                value: c.id,
                                label: `Move: ${c.label}`
                              }))}
                            />
                            <button
                              onClick={() => onDeleteTask(task.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
