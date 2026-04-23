'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Package, AlertTriangle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { InventoryItem } from '@/lib/types';

interface InventorySearchSelectProps {
  items: InventoryItem[];
  selectedItemId: number | null;
  onSelect: (item: InventoryItem | null) => void;
  label?: string;
  placeholder?: string;
}

export default function InventorySearchSelect({
  items,
  selectedItemId,
  onSelect,
  label = 'Select Material',
  placeholder = 'Search materials...'
}: InventorySearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedItem = items.find(i => i.id === selectedItemId);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full bg-slate-950 border rounded-xl py-3 px-4 flex items-center justify-between cursor-pointer transition-all
          ${isOpen ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-lg shadow-blue-600/10' : 'border-slate-800 hover:border-slate-700'}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {selectedItem ? (
            <>
              <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-blue-500" />
              </div>
              <div className="truncate">
                <p className="text-white font-bold text-sm truncate">{selectedItem.name}</p>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  Available: {selectedItem.quantity}
                </p>
              </div>
            </>
          ) : (
            <p className="text-slate-600 text-sm font-medium">{placeholder}</p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-[100] mt-2 w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  autoFocus
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Filter items..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600/50 transition-all"
                />
              </div>
            </div>

            <div className="max-h-[280px] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No items found
                </div>
              ) : (
                filteredItems.map(item => {
                  const isLowStock = item.quantity < 5;
                  const isOut = item.quantity === 0;
                  const isSelected = selectedItem?.id === item.id;

                  return (
                    <div 
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isOut) return;
                        onSelect(item);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`
                        p-3 rounded-xl flex items-center justify-between group transition-all
                        ${isOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        ${isSelected ? 'bg-blue-600' : 'hover:bg-slate-800'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                          ${isSelected ? 'bg-white/20' : 'bg-slate-950 group-hover:bg-slate-900'}
                        `}>
                          <Package className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              Stock: {item.quantity}
                            </span>
                            {isLowStock && !isOut && (
                              <div className="flex items-center gap-1">
                                <AlertTriangle className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-orange-500'}`} />
                                <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-white' : 'text-orange-500'}`}>
                                  Low Stock
                                </span>
                              </div>
                            )}
                            {isOut && (
                              <span className="text-[10px] font-bold uppercase text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-5 h-5 text-white" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
