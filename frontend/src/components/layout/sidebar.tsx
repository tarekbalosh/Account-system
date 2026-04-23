'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  User as UserIcon,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Sales', href: '/sales', icon: TrendingUp },
  { name: 'Expenses', href: '/expenses', icon: TrendingDown },
  { name: 'Purchases', href: '/purchases', icon: ShoppingCart },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: UserIcon, adminOnly: true },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || user?.role === 'ADMIN'
  );

  const sidebarContent = (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-screen overflow-hidden">
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <BarChart3 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">Accounting</h1>
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Pro System</span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2 py-6 scrollbar-hide">
        {filteredNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl transition-all group relative overflow-hidden",
                isActive 
                  ? "bg-blue-600/10 text-blue-500 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
              )}
            >
              <div className="flex items-center gap-3 relative z-10">
                <item.icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "text-blue-500 scale-110" : "text-slate-500 group-hover:text-slate-300 group-hover:scale-110")} />
                <span className="font-semibold tracking-tight">{item.name}</span>
              </div>
              <ChevronRight className={cn("w-4 h-4 transition-all duration-300 relative z-10", isActive ? "rotate-90 text-blue-500" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0")} />
              {isActive && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-blue-600/5 border-l-2 border-blue-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 group cursor-default shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center border border-slate-700/50 group-hover:border-blue-500/50 transition-colors">
              <UserIcon className="w-5 h-5 text-slate-300 group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.email}</p>
              <p className="text-[10px] uppercase tracking-widest text-blue-500 font-black">{user?.role}</p>
            </div>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all font-bold group"
        >
          <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block fixed left-0 top-0 h-screen">
        {sidebarContent}
      </div>
      <AnimatePresence>
        {isOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full shadow-2xl"
            >
              {sidebarContent}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

