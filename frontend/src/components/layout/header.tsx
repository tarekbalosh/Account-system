'use client';

import { useAuth } from '@/context/auth-context';
import { Bell, Search, Calendar, Menu, Command } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Notification } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get<Notification[]>('/notifications');
        setNotifications(response.data);
      } catch (error) {
        console.error('Failed to fetch notifications');
      }
    };
    if (user) fetchNotifications();
  }, [user]);

  const date = new Date().toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <header className="h-20 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors bg-slate-900/50 rounded-xl border border-white/5"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden md:flex items-center gap-3 text-slate-400 bg-slate-900/40 border border-white/5 px-4 py-2.5 rounded-2xl w-80 focus-within:border-blue-500/50 focus-within:text-slate-200 transition-all shadow-inner group">
          <Search className="w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search records..." 
            className="bg-transparent border-none outline-none text-sm w-full font-medium"
          />
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-800/50 border border-white/5 text-[10px] font-black uppercase text-slate-500">
            <Command className="w-2.5 h-2.5" /> K
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="hidden sm:flex items-center gap-2.5 px-4 py-2 bg-slate-900/40 border border-white/5 rounded-2xl text-slate-400 text-sm font-bold">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span className="tabular-nums">{date}</span>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2.5 rounded-2xl transition-all border ${
              showNotifications 
              ? 'bg-blue-600/10 border-blue-500/50 text-blue-500 shadow-lg shadow-blue-500/20' 
              : 'bg-slate-900/40 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,1)]" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-80 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl p-5 z-50 ring-1 ring-white/5"
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="text-white font-black text-lg tracking-tight">Alerts</h3>
                  <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{notifications.length} New</span>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 opacity-30 italic">
                      <Bell className="w-12 h-12 mb-2" />
                      <p className="text-sm font-bold">No new messages</p>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <div 
                        key={i} 
                        className={`p-4 rounded-2xl border transition-colors ${
                          n.type === 'CRITICAL' 
                          ? 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/20 text-rose-200' 
                          : 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/20 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-2 h-2 rounded-full ${n.type === 'CRITICAL' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 font-mono">{n.type}</p>
                        </div>
                        <p className="text-sm font-medium leading-relaxed">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

