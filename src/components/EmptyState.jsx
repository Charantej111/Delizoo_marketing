import React from 'react';
import { Plus, FolderPlus, ReceiptText, CheckSquare } from 'lucide-react';

export function EmptyState({ type, title, description, actionText, onAction }) {
  const getIcon = () => {
    switch (type) {
      case 'projects':
        return <FolderPlus className="w-7 h-7 text-zinc-500 dark:text-zinc-400" />;
      case 'expenses':
        return <ReceiptText className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />;
      case 'tasks':
        return <CheckSquare className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Plus className="w-7 h-7 text-zinc-500 dark:text-zinc-400" />;
    }
  };

  return (
    <div className="glass-panel border-dashed border-zinc-300/80 dark:border-zinc-800 rounded-2xl p-6 sm:p-10 text-center max-w-lg mx-auto my-6 transition-all">
      <div className="w-12 h-12 rounded-2xl bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-center mx-auto mb-3 shadow-2xs">
        {getIcon()}
      </div>
      <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
