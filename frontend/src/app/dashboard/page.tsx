'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ArrowRight,
  PlusCircle,
  Receipt,
  ShoppingCart,
  Calendar,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import Link from 'next/link';

interface ChartDataPoint {
  name: string;
  income: number;
  expenses: number;
  profit: number;
}

interface Transaction {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  date: string;
  description: string;
}

const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVars = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 25, stiffness: 200 } }
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    profit: 0,
    incomeChange: 0,
    expenseChange: 0,
  });

  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [saleSummary, expSummary, saleAll, expAll] = await Promise.all([
        api.get('/sales/summary?period=monthly'),
        api.get('/expenses/summary?period=monthly'),
        api.get('/sales?limit=5'),
        api.get('/expenses?limit=5')
      ]);

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mergedMap = new Map<string, ChartDataPoint>();

      saleSummary.data.forEach((item: any) => {
        const monthIndex = parseInt(item.period.split('-')[1]) - 1;
        const name = months[monthIndex];
        mergedMap.set(item.period, { name, income: item.total, expenses: 0, profit: item.total });
      });

      expSummary.data.forEach((item: any) => {
        const existing = mergedMap.get(item.period) || { 
          name: months[parseInt(item.period.split('-')[1]) - 1], 
          income: 0, 
          expenses: 0, 
          profit: 0 
        };
        existing.expenses = item.total;
        existing.profit = existing.income - item.total;
        mergedMap.set(item.period, existing);
      });

      const sortedData = Array.from(mergedMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([_, v]) => v);

      setChartData(sortedData);

      const totalIncome = sortedData.reduce((acc, curr) => acc + curr.income, 0);
      const totalExpenses = sortedData.reduce((acc, curr) => acc + curr.expenses, 0);
      
      setStats({
        income: totalIncome,
        expenses: totalExpenses,
        profit: totalIncome - totalExpenses,
        incomeChange: 12.5,
        expenseChange: -2.4 
      });

      const transactions: Transaction[] = [
        ...saleAll.data.map((s: any) => ({ ...s, type: 'INCOME' })),
        ...expAll.data.map((e: any) => ({ ...e, type: 'EXPENSE' }))
      ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

      setRecentTransactions(transactions);

    } catch (error) {
      console.error('Data fetch failed', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statCards = [
    { 
      label: 'Total Revenue', 
      value: stats.income, 
      icon: TrendingUp, 
      color: 'text-blue-500', 
      bgColor: 'bg-blue-500/10',
      change: stats.incomeChange,
      isPositive: true
    },
    { 
      label: 'Total Expenses', 
      value: stats.expenses, 
      icon: TrendingDown, 
      color: 'text-rose-500', 
      bgColor: 'bg-rose-500/10',
      change: stats.expenseChange,
      isPositive: false
    },
    { 
      label: 'Net Profit', 
      value: stats.profit, 
      icon: DollarSign, 
      color: 'text-emerald-500', 
      bgColor: 'bg-emerald-500/10',
      change: 15.3,
      isPositive: true
    },
    { 
      label: 'Operating Ratio', 
      value: (stats.expenses / (stats.income || 1)) * 100, 
      isPercent: true,
      icon: Activity, 
      color: 'text-amber-500', 
      bgColor: 'bg-amber-500/10',
      change: -1.2,
      isPositive: true
    },
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
          <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Syncing Ledger...</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVars}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Hero Header */}
      <motion.div variants={itemVars} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter">Command Center</h1>
            <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 uppercase tracking-widest animate-pulse">Live</span>
          </div>
          <p className="text-slate-400 font-medium text-lg">Real-time financial intelligence at your fingertips.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="p-3.5 rounded-2xl bg-slate-900 border border-white/5 text-slate-400 hover:text-blue-500 hover:border-blue-500/30 transition-all active:scale-95"
          >
            <Activity className="w-5 h-5" />
          </button>
          <Link 
            href="/sales"
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black shadow-xl shadow-blue-600/20 transition-all active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            <span>New Sale</span>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card, i) => (
          <motion.div 
            key={i} 
            variants={itemVars}
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] transition-all hover:bg-slate-900/60"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 blur-[80px] -mr-8 -mt-8 ${card.bgColor}`} />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-4 rounded-2xl ${card.bgColor} ${card.color} border border-white/5 group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6" />
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black tracking-widest border shrink-0 ${
                card.isPositive 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}>
                {card.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(card.change)}%
              </div>
            </div>
            
            <div className="space-y-1 relative z-10">
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{card.label}</p>
              <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tighter truncate">
                {card.isPercent ? `${card.value.toFixed(1)}%` : formatCurrency(card.value)}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Main Chart Container */}
        <motion.div variants={itemVars} className="lg:col-span-8 bg-slate-900/40 backdrop-blur-md border border-white/5 p-5 md:p-8 rounded-[2.5rem] flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <h3 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-500" />
                Revenue Analytics
              </h3>
              <p className="text-slate-500 text-sm font-medium">Performance tracking across current period.</p>
            </div>
            <div className="flex bg-slate-950 p-1.5 rounded-xl border border-white/5 self-start">
              {['Monthly', 'Weekly'].map((tab) => (
                <button 
                  key={tab}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    tab === 'Monthly' 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[300px] md:h-[400px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={10} 
                  fontWeight="900"
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
                  fontWeight="900"
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10} 
                  tickFormatter={(val) => `$${val/1000}k`} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '1.25rem',
                    padding: '1rem',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: '900' }}
                />
                <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32}>
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fillOpacity={0.8} />
                  ))}
                </Bar>
                <Bar dataKey="expenses" fill="rgba(255,255,255,0.05)" radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Activity Container */}
        <motion.div variants={itemVars} className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex-1 bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <Activity className="absolute -right-4 -top-4 w-40 h-40 text-white/[0.02] -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-500" />
                Latest Ledger
              </h3>
              <Link href="/reports" className="group/btn flex items-center gap-1.5 text-blue-500 text-[10px] font-black uppercase tracking-widest hover:text-blue-400 transition-colors">
                Audit All <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="space-y-4 relative z-10">
              {recentTransactions.map((trx, i) => (
                <div key={i} className="flex items-center gap-4 p-3.5 rounded-[1.5rem] bg-slate-950/40 border border-white/5 hover:border-white/10 transition-colors group/item">
                  <div className={`p-2.5 rounded-xl border border-white/10 ${
                    trx.type === 'INCOME' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'
                  }`}>
                    {trx.type === 'INCOME' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{trx.description}</p>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{formatDate(trx.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black tabular-nums ${
                      trx.type === 'INCOME' ? 'text-blue-500' : 'text-rose-500'
                    }`}>
                      {trx.type === 'INCOME' ? '+' : '-'}{formatCurrency(trx.amount)}
                    </p>
                  </div>
                </div>
              ))}
              
              {recentTransactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 opacity-20">
                  <ShoppingCart className="w-10 h-10 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Zero Trace detected</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl shadow-blue-600/20 group relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest mb-1.5">Collection Milestone</p>
              <div className="flex items-baseline justify-between mb-4">
                <h4 className="text-3xl font-black text-white">$10,000</h4>
                <span className="text-blue-100 text-xs font-bold opacity-60">65% Reached</span>
              </div>
              <div className="h-3 bg-black/20 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                  className="h-full bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                />
              </div>
            </div>
            <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 group-hover:scale-110 transition-transform duration-700" />
          </div>
        </motion.div>

      </div>

      {/* Momentum Chart */}
      <motion.div variants={itemVars} className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-8 rounded-[2.5rem]">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-500" />
              Profit Momentum
            </h3>
            <p className="text-slate-500 text-sm font-medium">Trajectory of net earnings across timeline.</p>
          </div>
          <span className="hidden sm:inline-flex px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">Upward Gradient</span>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="momentumGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.2} />
              <Tooltip 
                 contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  borderRadius: '1rem',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="#10b981" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#momentumGrad)" 
                animationDuration={2500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}

