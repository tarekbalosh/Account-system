// src/app/expenses/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Expense, ExpenseCategory } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    description: '',
  });

  const fetchExpenses = async () => {
    try {
      const [expRes, catRes] = await Promise.all([
        api.get<Expense[]>('/expenses'),
        api.get<ExpenseCategory[]>('/expenses/categories'), 
      ]);
      setExpenses(expRes.data);
      setCategories(catRes.data.length > 0 ? catRes.data : [
        { id: 1, name: 'Rent' },
        { id: 2, name: 'Salaries' },
        { id: 3, name: 'Supplies' },
        { id: 4, name: 'Utilities' },
      ]);
    } catch (err) {
      console.error('Failed to fetch expenses');
      // Mock for demo
      setExpenses([
        { id: 1, amount: 2000.00, date: '2024-04-01', categoryId: 1, description: 'Monthly rent' },
        { id: 2, amount: 450.75, date: '2024-04-05', categoryId: 4, description: 'Electricity bill' },
      ]);
      setCategories([{ id: 1, name: 'Rent' }, { id: 4, name: 'Utilities' }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingItem) {
        await api.patch(`/expenses/${editingItem.id}`, {
          ...formData,
          amount: parseFloat(formData.amount),
          categoryId: parseInt(formData.categoryId),
        });
      } else {
        await api.post('/expenses', {
          ...formData,
          amount: parseFloat(formData.amount),
          categoryId: parseInt(formData.categoryId),
        });
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ amount: '', date: new Date().toISOString().split('T')[0], categoryId: '', description: '' });
      fetchExpenses();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${editingItem ? 'update' : 'add'} expense`);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Expense',
      message: 'Are you sure you want to remove this expense record? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/expenses/${id}`);
          fetchExpenses();
        } catch (err) {
          alert('Failed to delete expense');
        }
      },
      variant: 'danger'
    });
  };

  const openEditModal = (item: Expense) => {
    setEditingItem(item);
    setFormData({
      amount: item.amount.toString(),
      date: new Date(item.date).toISOString().split('T')[0],
      categoryId: item.categoryId.toString(),
      description: item.description || '',
    });
    setIsModalOpen(true);
  };

  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         categories.find(c => c.id === exp.categoryId)?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || exp.categoryId.toString() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-8 space-y-8">
      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        variant={confirmConfig.variant}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Expense Management</h1>
          <p className="text-slate-400 mt-1">Record and categorize business expenditures.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-rose-600 hover:bg-rose-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Filter by description or category..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-600/50 transition-all font-medium"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-rose-600/50"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700/50 rounded-xl text-sm font-medium text-slate-300">
          <Calendar className="w-4 h-4 text-rose-500" />
          Last 30 Days
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Description</th>
                <th className="px-6 py-5">Category</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-500 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">Loading expenses...</p>
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500 font-medium">No records found for the current filters.</td>
                </tr>
              ) : (
                filteredExpenses.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-rose-500/10 p-2 rounded-lg">
                          <ArrowDownRight className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="text-white font-medium">{formatDate(item.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{item.description || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] uppercase tracking-wider font-bold rounded-full border border-slate-700/50">
                        {categories.find(c => c.id === item.categoryId)?.name || 'General Expense'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-bold">{formatCurrency(item.amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-2.5 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all group/edit"
                          title="Edit Record"
                        >
                          <Edit className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
                        </button>
                        <button 
                          onClick={() => handleDeleteExpense(item.id)}
                          className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all group/del"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">
                {editingItem ? 'Edit Expense Record' : 'Add New Expense'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                }} 
                className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-lg transition-all"
              >
                &times;
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center mb-6 text-sm">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleAddExpense} className="space-y-6">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-600/50 transition-all font-medium"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Category</label>
                <select 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-600/50 transition-all font-medium"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-600/50 transition-all font-bold text-lg"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rent, Salaries, utilites, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-600/50 transition-all font-medium"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-600/20 transition-all"
                >
                  {editingItem ? 'Update Record' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
