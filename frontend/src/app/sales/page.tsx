'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Sale, InventoryItem } from '@/lib/types';
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
  Package,
  TrendingUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import InventorySearchSelect from '@/components/ui/InventorySearchSelect';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Sale | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
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
    description: '',
    paymentType: 'Cash',
    inventoryId: null as number | null,
    quantity: '',
    debitAccount: 'Cash/Bank (1001)',
    creditAccount: 'Sales Revenue (4001)',
  });

  const fetchInitialData = async () => {
    try {
      const [salesRes, invRes, accRes] = await Promise.all([
        api.get<Sale[]>('/sales'),
        api.get<InventoryItem[]>('/inventory'),
        api.get<any[]>('/accounting/accounts'),
      ]);
      setSales(salesRes.data);
      setInventory(invRes.data);
      setAccounts(accRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.inventoryId) {
      setError('Please select a product from inventory');
      return;
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
        paymentType: formData.paymentType,
        debitAccount: formData.debitAccount,
        creditAccount: formData.creditAccount,
        items: [
          {
            inventoryId: formData.inventoryId,
            quantity: parseInt(formData.quantity)
          }
        ]
      };

      if (editingItem) {
        await api.patch(`/sales/${editingItem.id}`, payload);
      } else {
        await api.post('/sales', payload);
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ 
        amount: '', 
        date: new Date().toISOString().split('T')[0], 
        description: '',
        paymentType: 'Cash',
        inventoryId: null,
        quantity: '',
        debitAccount: 'Cash/Bank (1001)',
        creditAccount: 'Sales Revenue (4001)',
      });
      fetchInitialData();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${editingItem ? 'update' : 'record'} sale`);
    }
  };

  const handleDeleteSale = async (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Sale Record',
      message: 'Are you sure you want to delete this sale? The quantity will be restored to inventory.',
      onConfirm: async () => {
        try {
          await api.delete(`/sales/${id}`);
          fetchInitialData();
        } catch (err) {
          alert('Failed to delete sale');
        }
      },
      variant: 'danger'
    });
  };

  const openEditModal = (item: Sale) => {
    setEditingItem(item);
    const itemData = item.items?.[0];
    setFormData({
      amount: item.amount.toString(),
      date: new Date(item.date).toISOString().split('T')[0],
      description: item.description || '',
      paymentType: item.paymentType || 'Cash',
      inventoryId: itemData?.inventoryId || null,
      quantity: itemData?.quantity?.toString() || '',
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
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            Sales Transactions
          </h1>
          <p className="text-slate-400 mt-1">Record product sales and automatically update accounting ledgers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Record New Sale
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Sales (Period)</p>
          <h3 className="text-2xl font-bold text-white">{sales.length}</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <p className="text-slate-500 text-sm font-medium mb-1">Revenue Generated</p>
          <h3 className="text-2xl font-bold text-emerald-500">
            {formatCurrency(sales.reduce((acc, curr) => acc + curr.amount, 0))}
          </h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <p className="text-slate-500 text-sm font-medium mb-1">Items Sold</p>
          <h3 className="text-2xl font-bold text-white">
            {sales.reduce((acc, curr) => acc + (curr.items?.[0]?.quantity || 0), 0)}
          </h3>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Product Sold</th>
                <th className="px-6 py-5">Qty</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Sale Amount</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-500 font-medium">No sales recorded.</td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 text-white font-medium">{formatDate(sale.date)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{sale.items?.[0]?.inventory?.name || 'Manual Entry'}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{sale.description || 'No notes'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-bold tabular-nums">
                      {sale.items?.[0]?.quantity || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        sale.paymentType === 'Cash' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        sale.paymentType === 'Grab' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        sale.paymentType === 'Foodpanda' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                        'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        {sale.paymentType || 'Cash'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-black text-emerald-500">{formatCurrency(sale.amount)}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(sale)}
                          className="p-2.5 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSale(sale.id)}
                          className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Record Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {editingItem ? <Edit className="w-6 h-6 text-blue-500" /> : <TrendingUp className="w-6 h-6 text-emerald-500" />}
                {editingItem ? 'Edit Sale Entry' : 'Record Product Sale'}
              </h2>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                  setError(null);
                }} 
                className="text-slate-400 hover:text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center mb-6 text-sm font-bold">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSaveSale} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Sale Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all font-medium"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Sale Type / Source</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all font-bold"
                    value={formData.paymentType}
                    onChange={(e) => setFormData({...formData, paymentType: e.target.value})}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Grab">Grab</option>
                    <option value="Foodpanda">Foodpanda</option>
                    <option value="QR">QR</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 p-5 bg-slate-950/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-2 mb-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                  <Package className="w-3 h-3" /> Inventory Deduction
                </div>
                
                <InventorySearchSelect 
                  items={inventory}
                  selectedItemId={formData.inventoryId}
                  onSelect={(item) => {
                    setFormData({
                      ...formData, 
                      inventoryId: item?.id || null,
                    });
                  }}
                />

                <div>
                  <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Quantity Sold</label>
                  <input 
                    type="number" 
                    required
                    placeholder="e.g. 50"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all font-bold"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <div>
                  <label className="block text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Debit Account</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-bold"
                    value={formData.debitAccount}
                    onChange={(e) => setFormData({...formData, debitAccount: e.target.value})}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={`${acc.name} (${acc.code})`}>{acc.name} ({acc.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Credit Account</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-bold"
                    value={formData.creditAccount}
                    onChange={(e) => setFormData({...formData, creditAccount: e.target.value})}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={`${acc.name} (${acc.code})`}>{acc.name} ({acc.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Total Sale Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all font-bold text-xl"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Notes / Description</label>
                <input 
                  type="text" 
                  placeholder="e.g. Bulk order, Walk-in customer..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all font-medium"
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
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  {editingItem ? 'Update Sale' : 'Confirm Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
