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
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newMaterialError, setNewMaterialError] = useState<string | null>(null);


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
    debitAccount: 'Purchases (5001)',
    creditAccount: 'Cash/Bank (1001)',
    items: [{ materialId: '', quantity: '1', unitCost: '' }]
  });

  const [newMaterialData, setNewMaterialData] = useState({
    name: '',
    quantity: '0',
    unitCost: '0'
  });


  const fetchData = async () => {
    try {
      const [purRes, invRes, accRes] = await Promise.all([
        api.get<Purchase[]>('/purchases'),
        api.get<InventoryItem[]>('/inventory'),
        api.get<any[]>('/accounting/accounts'),
      ]);
      setPurchases(purRes.data);
      setInventory(invRes.data);
      setAccounts(accRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
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
        debitAccount: formData.debitAccount,
        creditAccount: formData.creditAccount,
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
        debitAccount: 'Purchases (5001)',
        creditAccount: 'Cash/Bank (1001)',
        items: [{ materialId: '', quantity: '1', unitCost: '' }] 
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save purchase');
    }
  };

  const handleCreateMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewMaterialError(null);
    try {
      const res = await api.post<InventoryItem>('/inventory', {
        name: newMaterialData.name,
        quantity: parseInt(newMaterialData.quantity),
        unitCost: parseFloat(newMaterialData.unitCost)
      });
      
      // Refresh inventory list
      const invRes = await api.get<InventoryItem[]>('/inventory');
      setInventory(invRes.data);
      
      // Close modal and reset form
      setIsNewMaterialModalOpen(false);
      setNewMaterialData({ name: '', quantity: '0', unitCost: '0' });
      
      // Optionally auto-select the new material in the last empty item row
      const newItems = [...formData.items];
      const emptyIndex = newItems.findIndex(i => i.materialId === '');
      if (emptyIndex !== -1) {
        newItems[emptyIndex].materialId = res.data.id.toString();
        newItems[emptyIndex].unitCost = res.data.unitCost.toString();
        setFormData({ ...formData, items: newItems });
      } else {
        newItems.push({
          materialId: res.data.id.toString(),
          quantity: '1',
          unitCost: res.data.unitCost.toString()
        });
        setFormData({ ...formData, items: newItems });
      }
    } catch (err: any) {
      setNewMaterialError(err.response?.data?.message || 'Failed to create material');
    }
  };


  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 min-h-screen">
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
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Purchase Transactions</h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">Record supplier invoices and manage accounting ledgers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setEditingPurchase(null);
              setFormData({ 
                supplier: '', 
                invoiceDate: new Date().toISOString().split('T')[0], 
                debitAccountCode: '5001',
                creditAccountCode: '1001',
                items: [{ materialId: '', quantity: '1', unitCost: '' }] 
              });
              setIsModalOpen(true);
            }}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
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

              <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h3 className="text-slate-300 font-bold flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Invoice Items
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => setIsNewMaterialModalOpen(true)}
                        className="flex-1 sm:flex-none text-emerald-500 hover:text-emerald-400 text-[10px] md:text-sm font-bold flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-lg transition-all"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Create Material
                      </button>
                      <button 
                        type="button"
                        onClick={handleAddItem}
                        className="flex-1 sm:flex-none text-blue-500 hover:text-blue-400 text-[10px] md:text-sm font-bold flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500/10 rounded-lg transition-all"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Add Row
                      </button>
                    </div>
                  </div>

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl group relative transition-all hover:border-slate-700">
                      <div className="sm:col-span-5">
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
                      <div className="grid grid-cols-2 sm:contents gap-3">
                        <div className="sm:col-span-2">
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
                        <div className="sm:col-span-4">
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
                      </div>
                      <div className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto sm:col-span-1 flex justify-end">
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
      {/* Create New Material Modal */}
      {isNewMaterialModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-white">New Material</h2>
              </div>
              <button 
                onClick={() => setIsNewMaterialModalOpen(false)} 
                className="text-slate-400 hover:text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {newMaterialError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center mb-6 text-sm">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                {newMaterialError}
              </div>
            )}

            <form onSubmit={handleCreateMaterial} className="space-y-6">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Material Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Fresh Tomatoes, Olive Oil"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all font-medium"
                  value={newMaterialData.name}
                  onChange={(e) => setNewMaterialData({...newMaterialData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Initial Qty</label>
                  <input 
                    type="number" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all font-bold"
                    value={newMaterialData.quantity}
                    onChange={(e) => setNewMaterialData({...newMaterialData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Base Cost ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/50 transition-all font-bold"
                    value={newMaterialData.unitCost}
                    onChange={(e) => setNewMaterialData({...newMaterialData, unitCost: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsNewMaterialModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all"
                >
                  Create & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
