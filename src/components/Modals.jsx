import React, { useState, useEffect, useRef } from 'react';
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
  UserCheck
} from 'lucide-react';
import { storageService } from '../services/storage';
import { CustomSelect } from './ui/CustomSelect';
import { CustomDatePicker } from './ui/CustomDatePicker';

// 1. Expense Modal (Add / Edit)
export function ExpenseModal({ isOpen, onClose, onSave, expenseToEdit, projects, existingPayers = [] }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    payer: '',
    vendor: '',
    category: 'Marketing & Print',
    paymentMode: 'UPI',
    utrNumber: '',
    howItHelped: '',
    proofDataUrl: '',
    proofName: '',
    proofType: ''
  });

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        ...expenseToEdit,
        amount: expenseToEdit.amount || ''
      });
    } else {
      setFormData({
        projectId: projects[0]?.id || '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        payer: existingPayers[0] || '',
        vendor: '',
        category: 'Marketing & Print',
        paymentMode: 'UPI',
        utrNumber: '',
        howItHelped: '',
        proofDataUrl: '',
        proofName: '',
        proofType: ''
      });
    }
  }, [expenseToEdit, projects]);

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
      alert('Please enter who gave or paid the amount.');
      return;
    }

    const payload = {
      ...formData,
      id: expenseToEdit ? expenseToEdit.id : 'exp-' + Date.now(),
      amount: Number(formData.amount),
      payer: formData.payer.trim(),
      createdAt: expenseToEdit ? expenseToEdit.createdAt : new Date().toISOString()
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 dark:bg-black/85 backdrop-blur-xs">
      <div className="glass-modal rounded-3xl max-w-2xl w-full max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              {expenseToEdit ? 'Edit Expenditure' : 'Record Project Expenditure'}
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">
              Track amount, who funded it, payment proof, and ROI impact.
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
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          {/* Amount and Linked Project */}
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
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">LINKED PROJECT</label>
              {projects.length > 0 ? (
                <CustomSelect
                  value={formData.projectId}
                  onChange={(val) => setFormData({ ...formData, projectId: val })}
                  options={[
                    { value: '', label: 'General Operations / Unassigned' },
                    ...projects.map(p => ({
                      value: p.id,
                      label: p.title,
                      sublabel: p.department || 'General'
                    }))
                  ]}
                  placeholder="Select project..."
                  searchable={projects.length > 5}
                />
              ) : (
                <div className="text-xs text-zinc-400 dark:text-zinc-500 py-2 px-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
                  No projects created yet (will be logged as General Ops).
                </div>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">WHEN (DATE) *</label>
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

          {/* Who gave the amount (Payer) */}
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">WHO GAVE THE AMOUNT (FUNDED BY / PAID BY) *</label>
            <input
              type="text"
              required
              value={formData.payer}
              onChange={(e) => setFormData({ ...formData, payer: e.target.value })}
              placeholder="e.g. Your Name, Founders Pool, Marketing Cash"
              className="w-full px-3 py-2 glass-input rounded-xl font-bold text-zinc-900 dark:text-white outline-none"
            />
            {existingPayers.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Quick select:</span>
                {existingPayers.slice(0, 5).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFormData({ ...formData, payer: p })}
                    className="px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 transition-all cursor-pointer"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vendor and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">VENDOR / RECIPIENT</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="e.g. Sri Krishna Graphics, Meta Ads"
                className="w-full px-3 py-2 glass-input rounded-xl font-medium text-zinc-800 dark:text-zinc-100 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">CATEGORY</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Marketing, Printing, Fuel, Tech, Rider Kit"
                className="w-full px-3 py-2 glass-input rounded-xl font-medium text-zinc-800 dark:text-zinc-100 outline-none"
              />
            </div>
          </div>

          {/* Payment Mode & UTR Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
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
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">UTR / TRANSACTION REF</label>
              <input
                type="text"
                value={formData.utrNumber}
                onChange={(e) => setFormData({ ...formData, utrNumber: e.target.value })}
                placeholder="e.g. UPI-428819003817"
                className="w-full px-3 py-2 glass-input rounded-xl font-mono-num font-semibold text-zinc-800 dark:text-zinc-100 outline-none"
              />
            </div>
          </div>

          {/* How It Helped (Impact & ROI) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-zinc-800 dark:text-zinc-200">HOW IT HELPED THE PROJECT (IMPACT & ROI) *</label>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Accountability</span>
            </div>
            <textarea
              rows={3}
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
              <label className="font-bold text-zinc-800 dark:text-zinc-200">PROOF OF PAYMENT (RECEIPT / SCREENSHOT)</label>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">Stored on your device</span>
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
                      ✓ Attached successfully
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

// 2. Project Modal (Add / Edit)
export function ProjectModal({ isOpen, onClose, onSave, projectToEdit }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    title: '',
    department: 'Marketing',
    budget: '',
    lead: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    priority: 'High',
    status: 'In Progress',
    description: '',
    progress: 0
  });

  useEffect(() => {
    if (projectToEdit) {
      setFormData(projectToEdit);
    } else {
      setFormData({
        title: '',
        department: 'Marketing',
        budget: '',
        lead: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        priority: 'High',
        status: 'In Progress',
        description: '',
        progress: 0
      });
    }
  }, [projectToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert('Please enter project title');
    const payload = {
      ...formData,
      id: projectToEdit ? projectToEdit.id : 'proj-' + Date.now(),
      budget: Number(formData.budget) || 0,
      progress: Number(formData.progress) || 0
    };
    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs">
      <div className="glass-modal rounded-3xl max-w-lg w-full max-h-[94vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-4 sm:p-5 border-b border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md z-10">
          <div>
            <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight">
              {projectToEdit ? 'Edit Project' : 'Create New Project'}
            </h3>
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400">Define department, budget allocation, and targets.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">PROJECT TITLE *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Kakinada College Campus Marketing Campaign"
              className="w-full px-3 py-2 glass-input rounded-xl font-bold text-zinc-900 dark:text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">DEPARTMENT</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Marketing, Rider Fleet, Restaurant Ops"
                className="w-full px-3 py-2 glass-input rounded-xl font-medium text-zinc-800 dark:text-zinc-100 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">ALLOCATED BUDGET (INR ₹)</label>
              <input
                type="number"
                min="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2 glass-input rounded-xl font-mono-num font-bold text-zinc-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">PROJECT LEAD / OWNER</label>
              <input
                type="text"
                value={formData.lead}
                onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                placeholder="e.g. Charan"
                className="w-full px-3 py-2 glass-input rounded-xl font-medium text-zinc-800 dark:text-zinc-100 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">STATUS</label>
              <CustomSelect
                value={formData.status}
                onChange={(val) => setFormData({ ...formData, status: val })}
                options={['Planning', 'In Progress', 'Completed', 'On Hold']}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">START DATE</label>
              <CustomDatePicker
                value={formData.startDate}
                onChange={(dateStr) => setFormData({ ...formData, startDate: dateStr })}
                placeholder="Pick start date"
              />
            </div>
            <div>
              <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">TARGET DEADLINE</label>
              <CustomDatePicker
                value={formData.endDate}
                onChange={(dateStr) => setFormData({ ...formData, endDate: dateStr })}
                placeholder="Pick deadline"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">DESCRIPTION & OBJECTIVES</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Key campaign goals, targets, and expected outputs..."
              className="w-full px-3 py-2 glass-input rounded-xl text-xs leading-relaxed text-zinc-800 dark:text-zinc-100 outline-none"
            />
          </div>

          <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs transition-all shadow-2xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold text-xs shadow-sm transition-all"
            >
              {projectToEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. Task Modal (Add / Edit)
export function TaskModal({ isOpen, onClose, onSave, projects }) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({
    title: '',
    projectId: projects[0]?.id || '',
    priority: 'High',
    assignee: '',
    dueDate: '',
    status: 'To Do',
    checklistText: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert('Please enter task title');

    const checklist = formData.checklistText
      ? formData.checklistText.split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    const payload = {
      id: 'task-' + Date.now(),
      title: formData.title.trim(),
      projectId: formData.projectId,
      priority: formData.priority,
      assignee: formData.assignee.trim(),
      dueDate: formData.dueDate,
      status: formData.status,
      completed: formData.status === 'Completed',
      checklist,
      completedItems: []
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs">
      <div className="glass-modal rounded-3xl max-w-md w-full shadow-2xl p-5 space-y-4 text-xs">
        <div className="flex justify-between items-center border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
          <h3 className="text-base font-black text-zinc-900 dark:text-white">Add Kanban Task</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
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
            <label className="block font-bold text-zinc-800 dark:text-zinc-200 mb-1">LINKED PROJECT</label>
            <CustomSelect
              value={formData.projectId}
              onChange={(val) => setFormData({ ...formData, projectId: val })}
              options={[
                { value: '', label: 'General / No Project' },
                ...projects.map(p => ({ value: p.id, label: p.title }))
              ]}
              placeholder="Select project..."
            />
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
              className="px-4 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold shadow-sm transition-all"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 4. Proof Modal (Inspect Uploaded Receipt)
export function ProofModal({ isOpen, onClose, expense, project }) {
  if (!isOpen || !expense) return null;

  const [zoom, setZoom] = useState(1);

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
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
                VERIFIED PROOF
              </span>
              <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white">{expense.vendor || 'Payment Proof'}</h3>
            </div>
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
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No proof file attached.</p>
          )}
        </div>

        {/* Details Footer */}
        <div className="p-4 bg-white/95 dark:bg-zinc-900/95 border-t border-zinc-200/60 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
          <div>
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">Who gave amount: </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400">{expense.payer}</span>
            <span className="text-zinc-300 dark:text-zinc-700 mx-2">•</span>
            <span className="font-semibold text-zinc-500 dark:text-zinc-400">Project: </span>
            <span className="font-bold text-zinc-900 dark:text-white">{project ? project.title : 'General'}</span>
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

// 5. Impact Modal ("How It Helped the Project")
export function ImpactModal({ isOpen, onClose, expense, project }) {
  if (!isOpen || !expense) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/60 dark:bg-zinc-950/80 backdrop-blur-xs">
      <div className="glass-modal rounded-3xl max-w-lg w-full shadow-2xl p-5 sm:p-6 space-y-4">
        <div className="flex justify-between items-start border-b border-zinc-200/60 dark:border-zinc-800 pb-3">
          <div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
              EXPENDITURE IMPACT STORY
            </span>
            <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white mt-1">
              How this ₹{Number(expense.amount).toLocaleString('en-IN')} helped Delizoo
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl p-4">
            <h4 className="font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] mb-2">
              Business Outcome & ROI:
            </h4>
            <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed italic">
              “{expense.howItHelped || 'No impact notes recorded.'}”
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block">WHO FUNDED THIS</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{expense.payer}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block">VENDOR / PAYEE</span>
              <span className="text-sm font-bold text-zinc-900 dark:text-white truncate block">{expense.vendor || 'Direct'}</span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block">DATE OF SPEND</span>
              <span className="text-xs font-bold font-mono-num text-zinc-800 dark:text-zinc-200">
                {expense.date} {expense.time || ''}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold block">LINKED PROJECT</span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate block">
                {project ? project.title : 'General'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-emerald-500 hover:bg-zinc-800 dark:hover:bg-emerald-600 text-white dark:text-zinc-950 font-bold text-xs transition-all shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
