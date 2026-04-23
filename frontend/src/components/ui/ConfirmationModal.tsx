'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20 text-white',
    warning: 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20 text-white',
    info: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 text-white'
  };

  const iconColors = {
    danger: 'text-rose-500 bg-rose-500/10',
    warning: 'text-amber-500 bg-amber-500/10',
    info: 'text-blue-500 bg-blue-500/10'
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden p-8"
      >
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 ${iconColors[variant]}`}>
            <AlertTriangle className="w-8 h-8" />
          </div>
          
          <h2 className="text-2xl font-black text-white mb-3 tracking-tight">{title}</h2>
          <p className="text-slate-400 font-medium leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 rounded-2xl transition-all"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 font-black py-4 rounded-2xl shadow-lg transition-all ${colors[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
