import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import { normalizePayerName, DEFAULT_PARTNERS } from '../services/storage';

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  expense,
  isDeleting = false,
  partners = DEFAULT_PARTNERS
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isDeleting]);

  if (!isOpen || !expense) return null;

  const amountNumber = Number(expense.amount) || 0;
  const payerName = normalizePayerName(expense.payer, partners) || expense.payer || 'Partner';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 dark:bg-black/85 backdrop-blur-xs animate-in"
      onClick={() => {
        if (!isDeleting) onClose();
      }}
    >
      <div
        className="glass-modal rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
              <span>Confirm Deletion</span>
            </span>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-500/10">
              <Trash2 className="w-7 h-7 stroke-[2.2]" />
            </div>

            <h3 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white tracking-tight">
              Delete Expenditure Record?
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
              This action will permanently delete this record from your ledger and Supabase database.
            </p>
          </div>

          {/* Expense Details Card */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                Amount to Remove
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono-num text-rose-600 dark:text-rose-400">
                ₹{amountNumber.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-zinc-400 block font-semibold">PAID BY</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                  {payerName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-400 block font-semibold">STREAM</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-100 truncate block">
                  {expense.spendArea || expense.category || 'General'}
                </span>
              </div>
              {expense.date && (
                <div>
                  <span className="text-[10px] text-zinc-400 block font-semibold">DATE</span>
                  <span className="font-mono-num text-zinc-700 dark:text-zinc-300">
                    {expense.date} {expense.time ? `• ${expense.time}` : ''}
                  </span>
                </div>
              )}
              {expense.vendor && (
                <div>
                  <span className="text-[10px] text-zinc-400 block font-semibold">VENDOR</span>
                  <span className="text-zinc-700 dark:text-zinc-300 truncate block">
                    {expense.vendor}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 pt-0 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => onConfirm(expense)}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-75 flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Record</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

