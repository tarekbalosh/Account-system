'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookText, 
  Search, 
  ArrowRight,
  Filter,
  Download,
  Calendar,
  Hash,
  Plus,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Transaction {
  id: number;
  date: string;
  description: string;
  reference: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
}

interface Account {
  id: number;
  name: string;
  code: string;
  type: string;
}

export default function TransactionsPage() {
  const [entries, setEntries] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    debitAccount: '',
    creditAccount: '',
    amount: '',
    description: '',
    reference: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [transRes, accRes] = await Promise.all([
        api.get('/accounting/transactions'),
        api.get('/accounting/accounts')
      ]);
      setEntries(transRes.data);
      setAccounts(accRes.data);
      
      // Set default accounts if available
      if (accRes.data.length >= 2) {
        setFormData(prev => ({
          ...prev,
          debitAccount: `${accRes.data[0].name} (${accRes.data[0].code})`,
          creditAccount: `${accRes.data[1].name} (${accRes.data[1].code})`
        }));
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.post('/accounting/transactions', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      
      setIsModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        debitAccount: accounts.length >= 1 ? `${accounts[0].name} (${accounts[0].code})` : '',
        creditAccount: accounts.length >= 2 ? `${accounts[1].name} (${accounts[1].code})` : '',
        amount: '',
        description: '',
        reference: ''
      });
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEntries = entries.filter(entry => 
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.debitAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.creditAccount.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
            <BookText className="w-10 h-10 text-blue-500" />
            Transaction Ledger
          </h1>
          <p className="text-slate-400 font-medium text-lg">System-wide double-entry transaction log.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search ledger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-medium"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all font-bold"
          >
            <Plus className="w-5 h-5" />
            New Entry
          </button>
        </div>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60">
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Debit</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Credit</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <BookText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Transactions Found</h3>
                    <p className="text-slate-500">Your accounting records will appear here as transactions occur.</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <motion.tr 
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-8 py-4 text-sm font-medium text-slate-400">
                      {formatDate(entry.date)}
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-500/80 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/10">DR</span>
                        <span className="text-sm font-bold text-slate-200">{entry.debitAccount}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-500/80 bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/10">CR</span>
                        <span className="text-sm font-bold text-slate-200">{entry.creditAccount}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <span className="text-blue-400 font-black tabular-nums text-lg">
                        {formatCurrency(entry.amount)}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm font-bold text-white max-w-xs truncate">
                      <div className="flex flex-col">
                        <span>{entry.description}</span>
                        {entry.reference && <span className="text-[10px] text-slate-500 uppercase tracking-widest">{entry.reference}</span>}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-xl shadow-2xl p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" />
              
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <Plus className="w-7 h-7 text-blue-500" />
                  Manual Transaction
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center mb-6 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveTransaction} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Transaction Date</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Reference (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. INV-001"
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                      value={formData.reference}
                      onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-6 bg-white/[0.02] rounded-3xl border border-white/5">
                  <div>
                    <label className="block text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Debit Account</label>
                    <select 
                      required
                      className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-sm"
                      value={formData.debitAccount}
                      onChange={(e) => setFormData({...formData, debitAccount: e.target.value})}
                    >
                      <option value="" disabled>Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={`${acc.name} (${acc.code})`}>{acc.name} ({acc.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-rose-500 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Credit Account</label>
                    <select 
                      required
                      className="w-full bg-slate-950 border border-white/5 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all font-bold text-sm"
                      value={formData.creditAccount}
                      onChange={(e) => setFormData({...formData, creditAccount: e.target.value})}
                    >
                      <option value="" disabled>Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={`${acc.name} (${acc.code})`}>{acc.name} ({acc.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 text-white placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-black text-2xl text-center"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Description</label>
                  <textarea 
                    required
                    placeholder="Describe the nature of this transaction..."
                    rows={3}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 text-lg"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Plus className="w-6 h-6" />}
                  Record Transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
