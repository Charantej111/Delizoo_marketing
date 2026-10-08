import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Upload,
  IndianRupee,
  ZoomIn,
  ZoomOut,
  Download,
  Eye,
  Trash2,
  FileText,
  User,
  Users,
  Plus,
  Layers,
  Sparkles
} from 'lucide-react';
import { storageService, POPULAR_CATEGORIES, DEFAULT_PARTNERS, DEFAULT_SPEND_AREAS, normalizePayerName } from '../services/storage';
import { CustomSelect } from './ui/CustomSelect';
import { CustomDatePicker } from './ui/CustomDatePicker';

// 1. Expense Modal (Add / Edit) with Custom Spend Area & Partner Integration
export function ExpenseModal({
  isOpen,
  onClose,
  onSave,
  expenseToEdit,
  partners = DEFAULT_PARTNERS,
  expenses = [],
  spendAreas = DEFAULT_SPEND_AREAS,
  onAddSpendArea,
  onOpenPartnerModal
}) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    spendArea: spendAreas[0] || DEFAULT_SPEND_AREAS[0],
    amount: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    payer: partners[0]?.name || 'N Charan Tej',
    vendor: '',
    category: 'Digital Ads & Marketing',
    paymentMode: 'UPI',
    utrNumber: '',
    howItHelped: '',
    proofDataUrl: '',
    proofName: '',
    proofType: ''
  });

  const [isCustomArea, setIsCustomArea] = useState(false);
  const [customAreaInput, setCustomAreaInput] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Compute live spent & remaining capital per partner
  const partnerSpendStats = useMemo(() => {
    const map = {};
    partners.forEach(p => {
      map[p.name] = {
        investment: Number(p.investment) || 0,
        spent: 0,
        role: p.role || 'Partner'
      };
    });

    expenses.forEach(e => {
      if (expenseToEdit && e.id === expenseToEdit.id) return; // ignore current when editing
      const payer = normalizePayerName(e.payer, partners);
      if (map[payer]) {
        map[payer].spent += Number(e.amount) || 0;
      }
    });

    return map;
  }, [partners, expenses, expenseToEdit]);

  // Synchronize and reset form data whenever modal opens or expenseToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        const area = expenseToEdit.spendArea || expenseToEdit.category || spendAreas[0] || DEFAULT_SPEND_AREAS[0];
        const isExisting = spendAreas.includes(area);
        setFormData({
          ...expenseToEdit,
          spendArea: area,
          amount: expenseToEdit.amount !== undefined && expenseToEdit.amount !== null ? expenseToEdit.amount : '',
          payer: normalizePayerName(expenseToEdit.payer, partners) || partners[0]?.name || 'N Charan Tej'
        });
        if (!isExisting && area) {
          setIsCustomArea(true);
          setCustomAreaInput(area);
        } else {
          setIsCustomArea(false);
          setCustomAreaInput('');
        }
      } else {
        setFormData({
          spendArea: spendAreas[0] || DEFAULT_SPEND_AREAS[0],
          amount: '',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          payer: partners[0]?.name || 'N Charan Tej',
          vendor: '',
          category: 'Digital Ads & Marketing',
          paymentMode: 'UPI',
          utrNumber: '',
          howItHelped: '',
          proofDataUrl: '',
          proofName: '',
          proofType: ''
        });
        setIsCustomArea(false);
        setCustomAreaInput('');
      }
    }
  }, [isOpen, expenseToEdit, partners, spendAreas]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessingFile(true);
    try {
      const processed = await storageService.processFileUpload(file);
      setFormData(prev => ({
        ...prev,
        proofDataUrl: processed.dataUrl,
        proofName: processed.name,
        proofType: processed.type
      }));
    } catch (err) {
      alert('Error uploading file: ' + err.message);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    if (!formData.payer.trim()) {
      alert('Please select or enter who paid this amount.');
      return;
    }

    const finalSpendArea = isCustomArea
      ? (customAreaInput.trim() || formData.spendArea || 'General Operations')
      : (formData.spendArea || 'General Operations');

    if (isCustomArea && customAreaInput.trim()) {
      if (onAddSpendArea) {
        onAddSpendArea(customAreaInput.trim());
      } else {
        storageService.addSpendArea(customAreaInput.trim());
      }
    }

    const payload = {
      ...formData,
      id: expenseToEdit ? expenseToEdit.id : 'exp-' + Date.now(),
      amount: Number(formData.amount),
      payer: formData.payer.trim(),
      spendArea: finalSpendArea,
      category: formData.category || finalSpendArea,
      createdAt: expenseToEdit ? expenseToEdit.createdAt : new Date().toISOString()
    };

    onSave(payload);
    onClose();
  };

  // Selected partner's remaining calculation
  const currentPayerStat = partnerSpendStats[formData.payer.trim()];
  const currentAmountNum = Number(formData.amount) || 0;
  const payerRemaining = currentPayerStat ? currentPayerStat.investment - currentPayerStat.spent : null;
  const payerRemainingAfterThis = payerRemaining !== null ? payerRemaining - currentAmountNum : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 dark:bg-black/85 backdrop-blur-xs">
      <div className="glass-modal rounded-3xl max-w-2xl w-full max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              {expenseToEdit ? 'Edit Expenditure' : 'Record Venture Expenditure'}
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              Log spend for Delizoo Kakinada, deduct from partner pool, and attach receipt proof.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4.5 text-xs">
          {/* Amount and Spend Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">AMOUNT SPENT (INR ₹) *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-sm text-zinc-500 dark:text-zinc-400">₹</span>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full pl-8 pr-3 py-2 text-sm sm:text-base font-bold font-mono-num glass-input rounded-xl text-zinc-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-zinc-800 dark:text-zinc-200">SPEND AREA / STREAM *</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomArea(!isCustomArea);
                    if (!isCustomArea && !customAreaInput) {
                      setCustomAreaInput('');
                    }
                  }}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  {isCustomArea ? 'Choose existing' : '+ Custom Stream'}
                </button>
              </div>

              {isCustomArea ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    required
                    autoFocus
                    value={customAreaInput}
                    onChange={(e) => {
                      setCustomAreaInput(e.target.value);
                      setFormData(prev => ({ ...prev, spendArea: e.target.value, category: e.target.value }));
                    }}
                    placeholder="Type custom spend area (e.g. Influencer Marketing, Rent)"
                    className="w-full px-3 py-2 glass-input rounded-xl font-bold text-zinc-900 dark:text-white outline-none"
                  />
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Will be added to your spend channels list automatically.
                  </p>
                </div>
              ) : (
                <CustomSelect
                  value={formData.spendArea}
                  onChange={(val) => {
                    if (val === '__custom__') {
                      setIsCustomArea(true);
                      setCustomAreaInput('');
                    } else {
                      setFormData({ ...formData, spendArea: val, category: val });
                    }
                  }}
                  options={[
                    ...spendAreas.map(area => ({ value: area, label: area })),
                    { value: '__custom__', label: '+ Add Custom Spend Area...' }
                  ]}
                  placeholder="Select operational spend area..."
                />
              )}
            </div>
          </div>

          {/* Who gave the amount (Investor / Partner Select) */}
          <div className="p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-zinc-800 dark:text-zinc-200">
                WHO PAID / FUNDED THIS (PARTNER CAPITAL) *
              </label>
              {onOpenPartnerModal && (
                <button
                  type="button"
                  onClick={onOpenPartnerModal}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Users className="w-3 h-3" />
                  <span>Manage Partners & Capital</span>
                </button>
              )}
            </div>

            {/* Quick Partner Selection Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {partners.map(p => {
                const stat = partnerSpendStats[p.name] || { investment: p.investment, spent: 0 };
                const rem = stat.investment - stat.spent;
                const isSelected = formData.payer === p.name;

                return (
                  <button
                    key={p.id || p.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, payer: p.name })}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 border-zinc-900 dark:border-emerald-500 shadow-sm'
                        : 'bg-white dark:bg-zinc-800/90 text-zinc-800 dark:text-zinc-200 border-zinc-200/80 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`font-bold text-xs truncate ${isSelected ? 'text-white dark:text-zinc-950' : 'text-zinc-900 dark:text-white'}`}>
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono-num gap-1">
                      <span className={`truncate min-w-0 flex-1 ${isSelected ? 'text-zinc-300 dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        ₹{p.investment.toLocaleString('en-IN')}
                      </span>
                      <span className={`font-bold shrink-0 ${
                        rem >= 0
                          ? isSelected ? 'text-emerald-300 dark:text-zinc-950 font-black' : 'text-emerald-600 dark:text-emerald-400'
                          : isSelected ? 'text-rose-300 dark:text-rose-950' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        ₹{rem.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Manual input / override if needed */}
            <div className="pt-1">
              <input
                type="text"
                required
                value={formData.payer}
                onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
                placeholder="Or custom payer name (e.g. Petty Cash)"
                className="w-full px-3 py-1.5 text-xs glass-input rounded-xl font-medium text-zinc-900 dark:text-white outline-none"
              />
            </div>

            {/* Live deduction impact note */}
            {currentPayerStat && (
              <div className={`p-2.5 rounded-xl text-[11px] font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                payerRemainingAfterThis >= 0
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/20'
              }`}>
                <span>
                  {formData.payer} balance: <strong>₹{payerRemaining.toLocaleString('en-IN')}</strong>
                </span>
                <span>
                  After this spend: <strong>₹{payerRemainingAfterThis.toLocaleString('en-IN')}</strong> {payerRemainingAfterThis < 0 ? '(Exceeds allocated pool)' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-zinc-800 dark:text-zinc-200">ITEM DETAIL / SUB-CATEGORY *</label>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CATEGORIES.map(cat => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.label })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                    formData.category === cat.label
                      ? 'bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 border-zinc-900 dark:border-emerald-500 font-bold shadow-2xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Meta Ads, Visiting Cards & Posters, Rider Shirts, Tech Domain"
              className="w-full px-3 py-2 glass-input rounded-xl font-medium text-zinc-800 dark:text-zinc-100 outline-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">DATE *</label>
              <CustomDatePicker
                value={formData.date}
                onChange={(dateStr) => setFormData({ ...formData, date: dateStr })}
                required
                placeholder="Select expense date"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">TIME (HH:MM)</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 glass-input rounded-xl font-mono-num font-semibold text-zinc-800 dark:text-zinc-100 outline-none"
              />
            </div>
          </div>

          {/* Vendor and Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">VENDOR / RECIPIENT</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g. Sri Krishna Graphics, Meta Ads, Indian Oil"
                className="w-full px-3 py-2 glass-input rounded-xl font-medium text-zinc-800 dark:text-zinc-100 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">PAYMENT MODE</label>
              <CustomSelect
                value={formData.paymentMode}
                onChange={(val) => setFormData({ ...formData, paymentMode: val })}
                options={[
                  { value: 'UPI', label: 'UPI (Google Pay / PhonePe / Paytm)' },
                  { value: 'Cash', label: 'Cash Voucher' },
                  { value: 'Bank Transfer', label: 'Bank Transfer (IMPS / NEFT)' },
                  { value: 'Card', label: 'Debit / Credit Card' }
                ]}
              />
            </div>
          </div>

          {/* UTR / Transaction Ref */}
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">UTR / TRANSACTION REF (OPTIONAL)</label>
            <input
              type="text"
              value={formData.utrNumber}
              onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
              placeholder="e.g. UPI-428819003817 / TXN-998822"
              className="w-full px-3 py-2 glass-input rounded-xl font-mono-num font-semibold text-zinc-800 dark:text-zinc-100 outline-none"
            />
          </div>

          {/* How It Helped (Impact & ROI) */}
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">
              HOW IT HELPED THE VENTURE (BUSINESS IMPACT & ROI) *
            </label>
            <textarea
              rows={2}
              required
              value={formData.howItHelped}
              onChange={(e) => setFormData({ ...formData, howItHelped: e.target.value })}
              placeholder="Explain what was accomplished with this spend. E.g. 'Printed 5,000 double-sided flyers for college campus blitz, resulting in 320 app installs and 120 first orders in 48 hours.'"
              className="w-full px-3 py-2 glass-input rounded-xl text-xs leading-relaxed text-zinc-800 dark:text-zinc-100 outline-none"
            />
          </div>

          {/* Proof of Payment Upload */}
          <div className="border border-zinc-200/70 dark:border-zinc-800 rounded-2xl p-3.5 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-zinc-800 dark:text-zinc-200">RECEIPT / PAYMENT SCREENSHOT</label>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Stored privately on your device</span>
            </div>

            {formData.proofDataUrl ? (
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 rounded-xl shadow-2xs">
                <div className="flex items-center gap-3 overflow-hidden">
                  <img
                    src={formData.proofDataUrl}
                    alt="Proof Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shrink-0"
                  />
                  <div className="truncate">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200 text-xs truncate">
                      {formData.proofName || 'Attached Document'}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      Attached successfully
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, proofDataUrl: '', proofName: '', proofType: '' }))}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 font-bold text-xs transition-all cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isProcessingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-800 dark:hover:border-zinc-500 rounded-xl bg-white/80 dark:bg-zinc-800/80 hover:bg-white dark:hover:bg-zinc-800 flex items-center justify-center gap-2 font-bold text-zinc-700 dark:text-zinc-200 transition-all shadow-2xs cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <span>{isProcessingFile ? 'Processing...' : 'Upload Receipt or Payment Screenshot'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-all shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold text-xs shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              {expenseToEdit ? 'Save Changes' : 'Record Expenditure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. Task Modal (Add / Edit) with Custom Operational Stream / Spend Area support
export function TaskModal({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  spendAreas = DEFAULT_SPEND_AREAS,
  onAddSpendArea
}) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    title: '',
    spendArea: spendAreas[0] || DEFAULT_SPEND_AREAS[0],
    priority: 'High',
    assignee: '',
    dueDate: '',
    status: 'To Do',
    checklistText: ''
  });

  const [isCustomArea, setIsCustomArea] = useState(false);
  const [customAreaInput, setCustomAreaInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        const area = taskToEdit.spendArea || spendAreas[0] || DEFAULT_SPEND_AREAS[0];
        const isExisting = spendAreas.includes(area);
        setFormData({
          title: taskToEdit.title || '',
          spendArea: area,
          priority: taskToEdit.priority || 'High',
          assignee: taskToEdit.assignee || '',
          dueDate: taskToEdit.dueDate || '',
          status: taskToEdit.status || 'To Do',
          checklistText: Array.isArray(taskToEdit.checklist) ? taskToEdit.checklist.join('\n') : ''
        });
        if (!isExisting && area) {
          setIsCustomArea(true);
          setCustomAreaInput(area);
        } else {
          setIsCustomArea(false);
          setCustomAreaInput('');
        }
      } else {
        setFormData({
          title: '',
          spendArea: spendAreas[0] || DEFAULT_SPEND_AREAS[0],
          priority: 'High',
          assignee: '',
          dueDate: '',
          status: 'To Do',
          checklistText: ''
        });
        setIsCustomArea(false);
        setCustomAreaInput('');
      }
    }
  }, [isOpen, taskToEdit, spendAreas]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert('Please enter task title');

    const finalSpendArea = isCustomArea
      ? (customAreaInput.trim() || formData.spendArea || 'General Operations')
      : (formData.spendArea || 'General Operations');

    if (isCustomArea && customAreaInput.trim()) {
      if (onAddSpendArea) {
        onAddSpendArea(customAreaInput.trim());
      } else {
        storageService.addSpendArea(customAreaInput.trim());
      }
    }

    const checklist = formData.checklistText
      ? formData.checklistText.split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      ...formData,
      id: taskToEdit ? taskToEdit.id : 'task-' + Date.now(),
      title: formData.title.trim(),
      spendArea: finalSpendArea,
      priority: formData.priority || 'High',
      assignee: (formData.assignee || '').trim(),
      dueDate: formData.dueDate || '',
      status: formData.status || 'To Do',
      completed: formData.status === 'Completed',
      checklist,
      completedItems: taskToEdit ? (taskToEdit.completedItems || []) : []
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs">
      <div className="glass-modal rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-4 text-xs">
        <div className="flex justify-between items-center border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
          <h3 className="text-base font-black text-zinc-900 dark:text-white">
            {taskToEdit ? 'Edit Task' : 'Add Milestone Task'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">TASK TITLE *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Inspect printed flyer proofs"
              className="w-full px-3 py-2 glass-input rounded-xl font-bold text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-zinc-800 dark:text-zinc-200">OPERATIONAL STREAM / SPEND AREA</label>
              <button
                type="button"
                onClick={() => setIsCustomArea(!isCustomArea)}
                className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                {isCustomArea ? 'Choose existing' : '+ Custom Stream'}
              </button>
            </div>

            {isCustomArea ? (
              <input
                type="text"
                required
                autoFocus
                value={customAreaInput}
                onChange={(e) => setCustomAreaInput(e.target.value)}
                placeholder="Type custom stream name"
                className="w-full px-3 py-2 glass-input rounded-xl font-bold text-zinc-900 dark:text-white outline-none"
              />
            ) : (
              <CustomSelect
                value={formData.spendArea}
                onChange={(val) => {
                  if (val === '__custom__') {
                    setIsCustomArea(true);
                    setCustomAreaInput('');
                  } else {
                    setFormData({ ...formData, spendArea: val });
                  }
                }}
                options={[
                  ...spendAreas.map(a => ({ value: a, label: a })),
                  { value: '__custom__', label: '+ Add Custom Stream...' }
                ]}
                placeholder="Select operational stream..."
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ASSIGNEE</label>
              <input
                type="text"
                value={formData.assignee}
                onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                placeholder="e.g. Charan"
                className="w-full px-3 py-2 glass-input rounded-xl font-semibold text-zinc-800 dark:text-zinc-100 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">PRIORITY</label>
              <CustomSelect
                value={formData.priority}
                onChange={(val) => setFormData({ ...formData, priority: val })}
                options={['Urgent', 'High', 'Medium', 'Low']}
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">DUE DATE</label>
            <CustomDatePicker
              value={formData.dueDate}
              onChange={(dateStr) => setFormData({ ...formData, dueDate: dateStr })}
              placeholder="Select due date"
            />
          </div>

          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">SUB-TASKS (ONE PER LINE)</label>
            <textarea
              rows={2}
              value={formData.checklistText}
              onChange={(e) => setFormData({ ...formData, checklistText: e.target.value })}
              placeholder="Step 1&#10;Step 2&#10;Step 3"
              className="w-full px-3 py-2 glass-input rounded-xl text-xs leading-relaxed text-zinc-800 dark:text-zinc-100 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold shadow-sm transition-all cursor-pointer"
            >
              {taskToEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. Proof Modal (Inspect Uploaded Receipt)
export function ProofModal({ isOpen, onClose, expense }) {
  if (!isOpen || !expense) return null;

  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
    }
  }, [isOpen, expense]);

  const handleDownload = () => {
    if (!expense.proofDataUrl) return;
    const a = document.createElement('a');
    a.href = expense.proofDataUrl;
    a.download = expense.proofName || `receipt_${expense.date}_${expense.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 dark:bg-zinc-950/90 backdrop-blur-md">
      <div className="glass-modal rounded-3xl max-w-3xl w-full max-h-[94vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
          <div>
            <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">{expense.vendor || 'Payment Receipt'}</h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 font-mono-num mt-0.5">
              {expense.date} • {expense.paymentMode} • UTR: {expense.utrNumber || 'N/A'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
              className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-200"
            >
              −
            </button>
            <span className="text-xs font-mono-num font-bold text-zinc-600 dark:text-zinc-300">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.25, 2.5))}
              className="px-2 py-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-200"
            >
              +
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1 shadow-2xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Preview Container */}
        <div className="flex-1 overflow-auto p-4 bg-zinc-100/70 dark:bg-zinc-950 flex items-center justify-center min-h-[380px]">
          {expense.proofDataUrl ? (
            <img
              src={expense.proofDataUrl}
              alt="Payment Receipt"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
              className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md transition-transform duration-150"
            />
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No receipt file attached.</p>
          )}
        </div>

        {/* Details Footer */}
        <div className="p-4 bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200/60 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
          <div>
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">Paid by: </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{expense.payer}</span>
            <span className="text-zinc-300 dark:text-zinc-700 mx-2">•</span>
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">Spend Area: </span>
            <span className="font-bold text-zinc-900 dark:text-white">{expense.spendArea || expense.category || 'General'}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 mr-2">Amount:</span>
            <span className="text-base font-black font-mono-num text-zinc-900 dark:text-white">
              ₹{Number(expense.amount).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Impact Modal ("How It Helped the Venture")
export function ImpactModal({ isOpen, onClose, expense }) {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs">
      <div className="glass-modal rounded-3xl max-w-lg w-full shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex justify-between items-start border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
              Business Outcome & ROI
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              ₹{Number(expense.amount).toLocaleString('en-IN')} spent on {expense.spendArea || expense.category || 'Operations'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-4">
            <h4 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] mb-2">
              Outcome Summary:
            </h4>
            <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
              {expense.howItHelped || 'No outcome notes recorded.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 min-w-0">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block truncate">WHO FUNDED THIS</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 truncate block">{expense.payer}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 min-w-0">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block truncate">VENDOR / PAYEE</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white truncate block">{expense.vendor || 'Direct'}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 min-w-0">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block truncate">DATE OF SPEND</span>
              <span className="text-xs font-bold font-mono-num text-zinc-800 dark:text-zinc-200 truncate block">
                {expense.date} {expense.time || ''}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 min-w-0">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block truncate">SPEND AREA</span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate block">
                {expense.spendArea || expense.category || 'General'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold text-xs transition-all shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// 5. Partner & Investor Capital Management Modal
export function PartnerModal({ isOpen, onClose, partners, onSavePartners }) {
  if (!isOpen) return null;

  const [partnerList, setPartnerList] = useState([]);

  // Sync partner list with current partners when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialList = (partners && partners.length > 0 ? partners : DEFAULT_PARTNERS).map(p => ({
        ...p,
        investment: p.investment !== undefined && p.investment !== null ? p.investment : 50000
      }));
      setPartnerList(initialList);
    }
  }, [isOpen, partners]);

  const totalPool = useMemo(() => {
    return partnerList.reduce((acc, p) => acc + (Number(p.investment) || 0), 0);
  }, [partnerList]);

  const handleUpdate = (idx, field, value) => {
    setPartnerList(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleAddPartner = () => {
    const newId = 'partner-' + Date.now();
    setPartnerList(prev => [
      ...prev,
      { id: newId, name: `Partner ${prev.length + 1}`, role: 'Investor / Partner', investment: 50000, color: '#10b981' }
    ]);
  };

  const handleRemovePartner = (idx) => {
    if (partnerList.length <= 1) {
      alert('At least 1 partner / investor must be configured.');
      return;
    }
    setPartnerList(prev => prev.filter((_, i) => i !== idx));
  };

  const handleResetDefaults = () => {
    if (confirm('Reset partner list to default founding partners?')) {
      setPartnerList(DEFAULT_PARTNERS);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formatted = partnerList.map(p => ({
      ...p,
      name: (p.name || '').trim(),
      role: (p.role || 'Partner').trim(),
      investment: Number(p.investment) || 0
    }));
    onSavePartners(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 dark:bg-black/85 backdrop-blur-xs">
      <div className="glass-modal rounded-3xl max-w-xl w-full max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Investors & Capital Allocation</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              Configure partner names, roles, and committed investment pools.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Total Capital Committed Banner */}
          <div className="p-3.5 rounded-2xl bg-zinc-100/90 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Total Combined Capital Pool
              </span>
              <p className="text-lg sm:text-xl font-black font-mono-num text-zinc-900 dark:text-white mt-0.5">
                ₹{totalPool.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {partnerList.length} Active Partners
              </span>
            </div>
          </div>

          {/* List of Partners */}
          <div className="space-y-3">
            {partnerList.map((p, idx) => (
              <div
                key={p.id || idx}
                className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-2xs space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 font-bold text-[11px] text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      required
                      value={p.name}
                      onChange={(e) => handleUpdate(idx, 'name', e.target.value)}
                      placeholder="Partner Name"
                      className="font-bold text-xs text-zinc-900 dark:text-white glass-input px-2.5 py-1 rounded-lg w-full outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePartner(idx)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Remove partner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                      ROLE / DESIGNATION
                    </label>
                    <input
                      type="text"
                      value={p.role}
                      onChange={(e) => handleUpdate(idx, 'role', e.target.value)}
                      placeholder="e.g. Lead, Marketing, Tech"
                      className="w-full text-[11px] font-medium text-zinc-800 dark:text-zinc-200 glass-input px-2.5 py-1 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                      INVESTMENT POOL (INR ₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      required
                      value={p.investment === 0 ? '0' : (p.investment ?? '')}
                      onChange={(e) => handleUpdate(idx, 'investment', e.target.value === '' ? '' : e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full text-[11px] font-mono-num font-bold text-zinc-900 dark:text-white glass-input px-2.5 py-1 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Partner & Reset buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleAddPartner}
              className="px-3 py-1.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-800 dark:hover:border-zinc-400 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Partner</span>
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline cursor-pointer"
            >
              Reset to Default Founders
            </button>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              Save Capital Commitments
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
