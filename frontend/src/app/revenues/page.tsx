// src/app/revenues/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Revenue, RevenueCategory } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

import InventorySearchSelect from '@/components/ui/InventorySearchSelect';
import { InventoryItem } from '@/lib/types';

export default function RevenuesPage() {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [categories, setCategories] = useState<RevenueCategory[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Revenue | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    inventoryId: null as number | null,
    quantity: '',
  });

  const fetchInitialData = async () => {
    try {
      const [revRes, catRes, invRes] = await Promise.all([
        api.get<Revenue[]>('/revenues'),
        api.get<RevenueCategory[]>('/revenues/categories'),
        api.get<InventoryItem[]>('/inventory'),
      ]);
      setRevenues(revRes.data);
      setCategories(catRes.data);
      setInventory(invRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        date: formData.date,
        categoryId: parseInt(formData.categoryId),
        description: formData.description,
        items: formData.inventoryId ? [{
          inventoryId: formData.inventoryId,
          quantity: parseInt(formData.quantity)
        }] : undefined
      };

      if (editingItem) {
        await api.patch(`/revenues/${editingItem.id}`, payload);
      } else {
        await api.post('/revenues', payload);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ 
        amount: '', 
        date: new Date().toISOString().split('T')[0], 
        categoryId: '', 
        description: '',
        inventoryId: null,
        quantity: ''
      });
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${editingItem ? 'update' : 'add'} revenue`);
    }
  };

  const handleDeleteRevenue = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Revenue',
      message: 'Are you sure you want to delete this revenue record? Stock adjustments will be reversed.',
      onConfirm: async () => {
        try {
          await api.delete(`/revenues/${id}`);
          fetchInitialData();
        } catch (err) {
          alert('Failed to delete revenue');
        }
      },
      variant: 'danger'
    });
  };

  const openEditModal = (item: Revenue) => {
    setEditingItem(item);
    const itemData = item.items?.[0];
    setFormData({
      amount: item.amount.toString(),
      date: new Date(item.date).toISOString().split('T')[0],
      categoryId: item.categoryId.toString(),
      description: item.description || '',
      inventoryId: itemData?.inventoryId || null,
      quantity: itemData?.quantity.toString() || '',
    });
    setIsModalOpen(true);
  };

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
          <h1 className="text-3xl font-bold text-white tracking-tight">Revenue Management</h1>
          <p className="text-slate-400 mt-1">Track and categorize daily income sources.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Income
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Filter by description..." 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700/50 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 transition-all">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700/50 rounded-xl text-sm font-medium text-slate-300">
          <Calendar className="w-4 h-4 text-blue-500" />
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
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-slate-500 font-medium">Loading revenues...</p>
                  </td>
                </tr>
              ) : revenues.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500 font-medium">No records found.</td>
                </tr>
              ) : (
                revenues.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 p-2 rounded-lg">
                          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-white font-medium">{formatDate(item.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{item.description || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] uppercase tracking-wider font-bold rounded-full border border-slate-700/50">
                        {categories.find(c => c.id === item.categoryId)?.name || 'General Income'}
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
                          onClick={() => handleDeleteRevenue(item.id)}
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

      {/* Add Revenue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">
                {editingItem ? 'Edit Revenue Entry' : 'Add Daily Income'}
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

            <form onSubmit={handleAddRevenue} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Category</label>
                  <select 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inventory Link (Optional)</span>
                </div>
                
                <InventorySearchSelect 
                  items={inventory}
                  selectedItemId={formData.inventoryId}
                  onSelect={(item) => setFormData({ ...formData, inventoryId: item ? item.id : null })}
                  label=""
                  placeholder="Link an inventory item..."
                />

                {formData.inventoryId && (
                  <div className="flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex-1">
                      <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1 ml-1">Qty to Sell</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        max={inventory.find(i => i.id === formData.inventoryId)?.quantity}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-600/50 transition-all font-bold"
                        value={formData.quantity}
                        onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                      />
                    </div>
                    <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 mt-5">
                       <p className="text-[10px] text-slate-500 font-bold uppercase">Stock Remaining</p>
                       <p className="text-sm font-bold text-white">
                         {(inventory.find(i => i.id === formData.inventoryId)?.quantity || 0) - (parseInt(formData.quantity) || 0)}
                       </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Total Amount ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-bold text-xl"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Lunch rush, Catering, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-2">
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
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  {editingItem ? 'Update Entry' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
