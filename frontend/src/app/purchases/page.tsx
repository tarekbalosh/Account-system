// src/app/purchases/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Purchase, InventoryItem } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Plus,
  Search, 
  ShoppingCart,
  Loader2,
  AlertCircle,
  PlusCircle,
  Trash2,
  Package,
  X,
  Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Confirmation State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Form State
  const [formData, setFormData] = useState({
    supplier: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    items: [{ materialId: '', quantity: '1', unitCost: '' }]
  });

  const fetchData = async () => {
    try {
      const [purRes, invRes] = await Promise.all([
        api.get<Purchase[]>('/purchases'),
        api.get<InventoryItem[]>('/inventory'),
      ]);
      setPurchases(purRes.data);
      setInventory(invRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
      // Mock for demo
      setInventory([{ id: 1, name: 'Potato', quantity: 15, unitCost: 12.50 }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { materialId: '', quantity: '1', unitCost: '' }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const openEditModal = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      supplier: purchase.supplier,
      invoiceDate: new Date(purchase.invoiceDate).toISOString().split('T')[0],
      items: (purchase.items || []).map(i => ({
        materialId: i.materialId.toString(),
        quantity: i.quantity.toString(),
        unitCost: i.unitCost.toString()
      }))
    });
    setIsModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Invoice',
      message: 'Are you sure you want to remove this purchase invoice? The stock will be automatically deducted from inventory.',
      onConfirm: () => handleDelete(id),
    });
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/purchases/${id}`);
      fetchData();
    } catch (err) {
      alert('Failed to delete purchase invoice');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        supplier: formData.supplier,
        invoiceDate: formData.invoiceDate,
        items: formData.items.map(item => ({
          materialId: parseInt(item.materialId),
          quantity: parseInt(item.quantity),
          unitCost: parseFloat(item.unitCost)
        }))
      };

      if (editingPurchase) {
        await api.patch(`/purchases/${editingPurchase.id}`, payload);
      } else {
        await api.post('/purchases', payload);
      }

      setIsModalOpen(false);
      setEditingPurchase(null);
      setFormData({ 
        supplier: '', 
        invoiceDate: new Date().toISOString().split('T')[0], 
        items: [{ materialId: '', quantity: '1', unitCost: '' }] 
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save purchase');
    }
  };

  return (
    <div className="p-8 space-y-8 min-h-screen">
      <ConfirmationModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Purchases & Invoices</h1>
          <p className="text-slate-400 mt-1">Record supplier invoices and manage stock acquisition.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setEditingPurchase(null);
              setFormData({ 
                supplier: '', 
                invoiceDate: new Date().toISOString().split('T')[0], 
                items: [{ materialId: '', quantity: '1', unitCost: '' }] 
              });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Record Invoice
          </button>
        </div>
      </div>

      {/* Grid Layout for Recent Purchases */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-visible shadow-xl relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-5">Invoice Date</th>
                <th className="px-6 py-5">Supplier</th>
                <th className="px-6 py-5">Items</th>
                <th className="px-6 py-5 text-right">Total Amount</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500 font-medium">No purchase invoices recorded yet.</td>
                </tr>
              ) : (
                purchases.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors group relative">
                    <td className="px-6 py-4">
                      <span className="text-white font-medium">{formatDate(item.invoiceDate)}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{item.supplier}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.items?.map((p, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-bold rounded border border-slate-700/50">
                            {p.material?.name} (x{p.quantity})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-blue-500 font-bold">{formatCurrency(item.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-2.5 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all group/edit"
                          title="Edit Invoice"
                        >
                          <Edit className="w-4 h-4 group-hover/edit:scale-110 transition-transform" />
                        </button>
                        <button 
                          onClick={() => confirmDelete(item.id)}
                          className="p-2.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all group/del"
                          title="Remove Invoice"
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

      {/* Record Invoice Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-8 animate-in zoom-in-95 duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                  {editingPurchase ? <Edit className="w-6 h-6 text-blue-500" /> : <ShoppingCart className="w-6 h-6 text-blue-500" />}
                </div>
                <h2 className="text-2xl font-bold text-white">{editingPurchase ? 'Edit Supplier Invoice' : 'Record Supplier Invoice'}</h2>
              </div>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPurchase(null);
                  setError(null);
                }} 
                className="text-slate-400 hover:text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center mb-6 text-sm">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Supplier Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Sysco, Local Farms"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium"
                    value={formData.supplier}
                    onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Invoice Date</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-300 font-bold flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Invoice Items
                  </h3>
                  <button 
                    type="button"
                    onClick={handleAddItem}
                    className="text-blue-500 hover:text-blue-400 text-sm font-bold flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 rounded-lg transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl group relative transition-all hover:border-slate-700">
                      <div className="col-span-5">
                        <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1 ml-1">Material</label>
                        <select 
                          required
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600/50"
                          value={item.materialId}
                          onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                        >
                          <option value="">Select Material</option>
                          {inventory.map(inv => (
                            <option key={inv.id} value={inv.id}>{inv.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1 ml-1">Qty</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600/50"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-span-4">
                        <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1 ml-1">Unit Cost ($)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          required
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-600/50 font-bold"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <button 
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                          className="p-2 text-slate-600 hover:text-red-500 disabled:opacity-30 transition-all mb-0.5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingPurchase(null);
                  }}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  {editingPurchase ? 'Update Invoice' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
