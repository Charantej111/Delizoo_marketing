import React from 'react';
import { Plus, FolderPlus, ReceiptText, CheckSquare } from 'lucide-react';

export function EmptyState({ type, title, description, actionText, onAction }) {
  const getIcon = () => {
    switch (type) {
      case 'projects':
        return <FolderPlus className="w-7 h-7 text-slate-500" />;
      case 'expenses':
        return <ReceiptText className="w-7 h-7 text-emerald-600" />;
      case 'tasks':
        return <CheckSquare className="w-7 h-7 text-blue-500" />;
      default:
        return <Plus className="w-7 h-7 text-slate-500" />;
    }
  };

  return (
    <div className="glass-panel border-dashed border-slate-300/80 rounded-2xl p-6 sm:p-10 text-center max-w-lg mx-auto my-6 transition-all">
      <div className="w-12 h-12 rounded-2xl bg-slate-100/80 border border-slate-200/80 flex items-center justify-center mx-auto mb-3 shadow-2xs">
        {getIcon()}
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
}
