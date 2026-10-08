import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * Custom Glassmorphism Select Dropdown
 * Replaces native <select> with a polished, accessible, searchable dropdown.
 */
export function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  searchable = false,
  className = '',
  triggerClassName = '',
  size = 'md', // 'sm' | 'md'
  disabled = false,
  align = 'left' // 'left' | 'right'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to [{ value, label, sublabel, badge }]
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: opt, label: String(opt) };
    }
    return {
      value: opt.value,
      label: opt.label || String(opt.value),
      sublabel: opt.sublabel,
      badge: opt.badge,
      icon: opt.icon
    };
  });

  const selectedOption = normalizedOptions.find(opt => String(opt.value) === String(value));

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input if searchable
      if (searchable && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, searchable]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredOptions = normalizedOptions.filter(opt => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  });

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 text-left transition-all outline-none rounded-xl font-medium ${
          isSmall
            ? 'px-2.5 py-1.5 text-xs'
            : 'px-3 py-2 text-xs sm:text-sm'
        } ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-50 border border-slate-200'
            : isOpen
            ? 'bg-white border-slate-900 shadow-sm ring-2 ring-slate-900/10'
            : 'glass-input hover:bg-white/90 text-slate-800'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-slate-500">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${selectedOption ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-900' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-full min-w-[200px] max-w-sm rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl py-1.5 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Optional Search Input */}
          {(searchable || normalizedOptions.length > 7) && (
            <div className="px-2.5 pt-1 pb-2 border-b border-slate-100">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full pl-8 pr-7 py-1 text-xs bg-slate-50/80 rounded-lg border border-slate-200/60 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-slate-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options list */}
          <div className="max-h-56 overflow-y-auto p-1 space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white font-bold shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && (
                        <span className={`shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                          {opt.icon}
                        </span>
                      )}
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span
                            className={`block text-[10px] truncate ${
                              isSelected ? 'text-slate-300' : 'text-slate-400'
                            }`}
                          >
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
