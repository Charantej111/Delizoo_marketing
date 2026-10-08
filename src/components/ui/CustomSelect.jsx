import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

/**
 * Custom Glassmorphism Select Dropdown
 * Supports responsive dark mode & light mode with search and keyboard accessibility.
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

  // Normalize options to [{ value, label, sublabel, badge, icon }]
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
            ? 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800'
            : isOpen
            ? 'bg-white dark:bg-zinc-900 border-zinc-900 dark:border-emerald-500 shadow-sm ring-2 ring-zinc-900/10 dark:ring-emerald-500/20'
            : 'glass-input hover:bg-white/90 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-100'
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.icon && (
            <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${selectedOption ? 'text-zinc-900 dark:text-white font-semibold' : 'text-zinc-400 dark:text-zinc-500'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="px-1.5 py-0.2 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-zinc-900 dark:text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 w-full min-w-[200px] max-w-sm rounded-2xl bg-white/98 dark:bg-zinc-900/98 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800 shadow-2xl py-1.5 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Optional Search Input */}
          {(searchable || normalizedOptions.length > 7) && (
            <div className="px-2.5 pt-1 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to filter..."
                  className="w-full pl-8 pr-7 py-1 text-xs bg-zinc-50/80 dark:bg-zinc-800/80 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:bg-white dark:focus:bg-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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
              <div className="py-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
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
                        ? 'bg-zinc-900 dark:bg-emerald-500 text-white dark:text-zinc-950 font-bold shadow-2xs'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-white font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && (
                        <span className={`shrink-0 ${isSelected ? 'text-white dark:text-zinc-950' : 'text-zinc-500 dark:text-zinc-400'}`}>
                          {opt.icon}
                        </span>
                      )}
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.sublabel && (
                          <span
                            className={`block text-[10px] truncate ${
                              isSelected
                                ? 'text-zinc-300 dark:text-zinc-800'
                                : 'text-zinc-400 dark:text-zinc-500'
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
                              ? 'bg-white/20 dark:bg-zinc-900/30 text-white dark:text-zinc-950'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-zinc-950 shrink-0" />
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
