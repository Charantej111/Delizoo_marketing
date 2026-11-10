import React, { useEffect, useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Receipt,
  FileText,
  Check,
  RotateCcw,
  ShieldCheck,
  Mail,
  Trash2
} from 'lucide-react';
import { normalizePayerName, DEFAULT_PARTNERS } from '../services/storage';

export function ExpenseStatusPopup({
  isOpen,
  onClose,
  status = 'success', // 'success' | 'failed' | 'deleted'
  isEdit = false,
  expense,
  cloudSynced = true,
  cloudError = null,
  emailDispatched = false,
  error = null,
  partners = DEFAULT_PARTNERS,
  expenses = [],
  onRecordAnother,
  onViewInLedger,
  onRetry
}) {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const autoCloseDurationMs = status === 'deleted' ? 5000 : 6500;

  const isSuccess = status === 'success';
  const isDeleted = status === 'deleted';
  const isFailed = status === 'failed';

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-dismiss countdown timer (active for success and deleted states)
  useEffect(() => {
    if (!isOpen || isFailed) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const intervalMs = 50;
    const step = (intervalMs / autoCloseDurationMs) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            onClose();
            return 0;
          }
          return Math.max(0, prev - step);
        });
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isOpen, status, isPaused, onClose, isFailed, autoCloseDurationMs]);

  // Partner balance calculation
  const partnerStat = useMemo(() => {
    if (!expense?.payer || !partners) return null;
    const payerName = normalizePayerName(expense.payer, partners);
    const partner = partners.find(
      (p) => p.name.toLowerCase() === payerName.toLowerCase()
    );
    if (!partner) return null;

    const totalSpent = (expenses || []).reduce((acc, e) => {
      const eNorm = normalizePayerName(e.payer, partners);
      if (eNorm.toLowerCase() === payerName.toLowerCase()) {
        return acc + (Number(e.amount) || 0);
      }
      return acc;
    }, 0);

    const investment = Number(partner.investment) || 0;
    const remaining = investment - totalSpent;

    return {
      name: partner.name,
      role: partner.role || 'Partner',
      color: partner.color || '#10b981',
      investment,
      spent: totalSpent,
      remaining
    };
  }, [expense, partners, expenses]);

  if (!isOpen) return null;

  const amountNumber = Number(expense?.amount) || 0;
  const isPdf =
    expense?.proofType === 'application/pdf' ||
    expense?.proofName?.toLowerCase().endsWith('.pdf') ||
    expense?.proofDataUrl?.startsWith('data:application/pdf');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/70 dark:bg-black/85 backdrop-blur-xs animate-in"
      onClick={onClose}
    >
      <div
        className="glass-modal rounded-3xl max-w-md w-full shadow-2xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Top Header with Close Button */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isSuccess
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                  : isDeleted
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
              }`}
            >
              {isSuccess && (
                <>
                  <Check className="w-3 h-3 stroke-[3]" />
                  <span>{isEdit ? 'Expense Updated' : 'Expense Recorded'}</span>
                </>
              )}
              {isDeleted && (
                <>
                  <Trash2 className="w-3 h-3 stroke-[2.5]" />
                  <span>Expense Deleted</span>
                </>
              )}
              {isFailed && (
                <>
                  <AlertCircle className="w-3 h-3 stroke-[2.5]" />
                  <span>Action Failed</span>
                </>
              )}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
            title="Close popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Status Icon & Title */}
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg transition-transform ${
                isSuccess
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10 scale-100'
                  : isDeleted
                  ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-rose-500/10 scale-100'
                  : 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-rose-500/10'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />}
              {isDeleted && <Trash2 className="w-7 h-7 stroke-[2.2]" />}
              {isFailed && <AlertCircle className="w-7 h-7 stroke-[2.5]" />}
            </div>

            <h3 className="text-lg sm:text-xl font-black text-zinc-950 dark:text-white tracking-tight">
              {isSuccess
                ? isEdit
                  ? 'Expenditure Updated Successfully'
                  : 'Expenditure Recorded Successfully'
                : isDeleted
                ? 'Expenditure Deleted Successfully'
                : 'Failed to Process Expenditure'}
            </h3>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs leading-relaxed">
              {isSuccess
                ? 'Your transaction has been securely committed to Delizoo OS and ledger accounts updated.'
                : isDeleted
                ? 'The expenditure record has been permanently deleted from both local ledger and Supabase database.'
                : error || 'Could not complete operation. Please check details and try again.'}
            </p>
          </div>

          {/* Details Box for Success or Deleted */}
          {(isSuccess || isDeleted) && expense && (
            <div className="space-y-3">
              {/* Highlight Amount Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                    {isDeleted ? 'Amount Removed' : 'Amount Spent'}
                  </span>
                  <div
                    className={`text-2xl sm:text-3xl font-black font-mono-num mt-0.5 ${
                      isDeleted ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-950 dark:text-white'
                    }`}
                  >
                    ₹{amountNumber.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-200/80 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                    {expense.paymentMode || 'UPI'}
                  </span>
                  {expense.date && (
                    <div className="text-[11px] text-zinc-400 font-mono-num mt-1">
                      {expense.date}
                      {expense.time && ` • ${expense.time}`}
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">
                    {isDeleted ? 'PAID BY' : 'SPENT BY (PARTNER)'}
                  </span>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {normalizePayerName(expense.payer, partners) || expense.payer}
                  </div>
                  {isSuccess && partnerStat && (
                    <div
                      className={`text-[10px] font-mono-num font-semibold mt-1 truncate ${
                        partnerStat.remaining >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      ₹{partnerStat.remaining.toLocaleString('en-IN')} pool balance
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">
                    STREAM / SPEND AREA
                  </span>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {expense.spendArea || expense.category || 'General Operations'}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate mt-1">
                    {expense.vendor || expense.category || 'Operational'}
                  </div>
                </div>
              </div>

              {/* System Audit Feedback */}
              <div className="p-2.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Database Status:</span>
                  </div>
                  <span
                    className={`font-semibold ${
                      cloudSynced
                        ? isDeleted ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {cloudSynced
                      ? isDeleted ? '✓ Deleted from Supabase Database' : '✓ Synced with Supabase'
                      : isDeleted ? 'Removed locally (Offline mode)' : 'Saved locally (Offline mode)'}
                  </span>
                </div>

                {isDeleted && (
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200/40 dark:border-zinc-700/40">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Ledger Balance:</span>
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Recalculated immediately
                    </span>
                  </div>
                )}

                {isSuccess && expense.proofDataUrl && (
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200/40 dark:border-zinc-700/40">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                      <FileText className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Receipt Verification:</span>
                    </div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">
                      {isPdf ? 'PDF Receipt Attached' : 'Image Proof Attached'}
                    </span>
                  </div>
                )}

                {isSuccess && emailDispatched && (
                  <div className="flex items-center justify-between pt-1 border-t border-zinc-200/40 dark:border-zinc-700/40">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                      <Mail className="w-3.5 h-3.5 text-sky-500" />
                      <span>Founders Alert:</span>
                    </div>
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      Email alerts dispatched
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* If Failed: Error Message & Attempt Summary */}
          {isFailed && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Failure Details</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300/90 pl-5.5">
                  {error || 'Unable to complete transaction. Please check your network or permissions.'}
                </p>
              </div>

              {expense && (
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Target Entry
                  </span>
                  <div className="flex justify-between font-medium text-zinc-800 dark:text-zinc-200">
                    <span>₹{Number(expense.amount || 0).toLocaleString('en-IN')}</span>
                    <span>{expense.payer || 'Unknown'}</span>
                    <span>{expense.spendArea || expense.category || 'General'}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 pt-0 flex flex-wrap items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/80 mt-2">
          {isDeleted ? (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-rose-600 hover:bg-zinc-800 dark:hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Done
            </button>
          ) : isSuccess ? (
            <>
              {onViewInLedger && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewInLedger(expense);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>View in Ledger</span>
                </button>
              )}

              {onRecordAnother && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRecordAnother();
                  }}
                  className="px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Record Another</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-all cursor-pointer"
              >
                Dismiss
              </button>

              {onRetry && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRetry(expense);
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Edit & Retry</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Auto-Dismiss Countdown Progress Bar (Active for Success & Deleted) */}
        {(isSuccess || isDeleted) && (
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1 overflow-hidden">
            <div
              className={`h-full transition-all ease-linear ${
                isDeleted ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
