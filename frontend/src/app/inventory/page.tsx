// src/app/inventory/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { InventoryItem } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { 
  Plus, 
  Search, 
  Package,
  AlertTriangle,
  Loader2,
  AlertCircle,
  History,
  TrendingDown,
  Trash2,
  Edit,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import InventorySearchSelect from '@/components/ui/InventorySearchSelect';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
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

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    quantity: '0',
    unitCost: '0',
  });

  const [withdrawData, setWithdrawData] = useState({
    itemId: null as number | null,
    quantity: '',
  });

  const fetchInventory = async () => {
    try {
      const response = await api.get<InventoryItem[]>('/inventory');
      setItems(response.data);
    } catch (err) {
      console.error('Failed to fetch inventory');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const data = {
        ...formData,
        quantity: parseInt(formData.quantity),
        unitCost: parseFloat(formData.unitCost),
      };

      if (editingItem) {
        await api.patch(`/inventory/${editingItem.id}`, data);
      } else {
        await api.post('/inventory', data);
      }
      
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ name: '', quantity: '0', unitCost: '0' });
      fetchInventory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save inventory item');
    }
  };

  const confirmDelete = (id: number) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Item',
      message: 'Are you sure you want to remove this item? This action cannot be undone.',
      onConfirm: () => handleDeleteItem(id),
      variant: 'danger'
    });
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await api.delete(`/inventory/${id}`);
      fetchInventory();
    } catch (err) {
      alert('Failed to delete item');
    }
  };

  const confirmBulkDelete = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Selected',
      message: `Are you sure you want to remove ${selectedIds.length} items from your inventory?`,
      onConfirm: handleBulkDelete,
      variant: 'danger'
    });
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/inventory/${id}`)));
      setSelectedIds([]);
      fetchInventory();
    } catch (err) {
      alert('Failed to delete some items');
    }
  };

  const confirmClearAll = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'Clear Inventory',
      message: 'CRITICAL: This will remove ALL items from your inventory permanently. Are you absolutely sure?',
      onConfirm: handleClearAll,
      variant: 'danger'
    });
  };

  const handleClearAll = async () => {
    try {
      await Promise.all(items.map(item => api.delete(`/inventory/${item.id}`)));
      fetchInventory();
    } catch (err) {
      alert('Failed to clear inventory');
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!withdrawData.itemId || !withdrawData.quantity) return;

    try {
      await api.post(`/inventory/${withdrawData.itemId}/withdraw`, {
        quantity: parseInt(withdrawData.quantity),
      });
      
      setIsWithdrawModalOpen(false);
      setWithdrawData({ itemId: null, quantity: '' });
      fetchInventory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to withdraw items');
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      unitCost: item.unitCost.toString(),
    });
    setIsModalOpen(true);
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-8 space-y-8 min-h-screen pb-20">
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Inventory Management</h1>
          <p className="text-slate-400 mt-1">Track material stock levels and acquisition costs.</p>
        </div>
        <div className="flex items-center gap-3">
          {items.length > 0 && (
            <button 
              onClick={confirmClearAll}
              className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl font-bold hover:bg-rose-500 hover:text-white transition-all text-sm"
            >
              Clear Inventory
            </button>
          )}
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="px-6 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            <TrendingDown className="w-5 h-5 text-rose-500" />
            Withdraw Stock
          </button>
          <button 
            onClick={() => {
              setEditingItem(null);
              setFormData({ name: '', quantity: '0', unitCost: '0' });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Material
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-600 p-4 rounded-2xl flex items-center justify-between shadow-xl shadow-blue-600/20"
        >
          <div className="flex items-center gap-4 text-white">
            <CheckSquare className="w-6 h-6" />
            <span className="font-bold text-lg">{selectedIds.length} items selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-sm"
            >
              Deselect All
            </button>
            <button 
              onClick={confirmBulkDelete}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Items</p>
          <h3 className="text-2xl font-bold text-white">{items.length}</h3>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <p className="text-slate-500 text-sm font-medium mb-1">Low Stock Alerts</p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-orange-500">{items.filter(i => i.quantity < 5).length}</h3>
            <AlertTriangle className="w-5 h-5 text-orange-500" />
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <p className="text-slate-500 text-sm font-medium mb-1">Total Inventory Value</p>
          <h3 className="text-2xl font-bold text-white">
            {formatCurrency(items.reduce((acc, curr) => acc + (curr.quantity * curr.unitCost), 0))}
          </h3>
        </div>
      </div>

      {/* Grid Layout for Items */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id} 
              className={`
                bg-slate-900 border rounded-3xl p-6 transition-all group relative overflow-visible
                ${selectedIds.includes(item.id) ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-slate-800 hover:border-slate-700'}
              `}
            >
              <div className="flex items-start justify-between relative">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleSelection(item.id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${selectedIds.includes(item.id) ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                  >
                    {selectedIds.includes(item.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{item.name}</h4>
                    <p className="text-slate-500 text-sm">ID: #{item.id.toString().padStart(4, '0')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(item)}
                    className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                    title="Edit Item"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => confirmDelete(item.id)}
                    className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Remove Item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button 
                    className="p-2 text-slate-500 hover:text-white"
                    title="View History"
                  >
                    <History className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Quantity</p>
                  <div className="flex items-center justify-between">
                    <p className={`text-xl font-bold ${item.quantity < 5 ? 'text-orange-500' : 'text-white'}`}>
                      {item.quantity}
                    </p>
                    {item.quantity < 5 && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                  </div>
                </div>
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/50">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Avg Unit Cost</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(item.unitCost)}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Material Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">{editingItem ? 'Edit Material' : 'Add New Material'}</h2>
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
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center mb-6 text-sm">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-6">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Material Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Flour, Sugar, Milk"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Quantity</label>
                  <input 
                    type="number" 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-bold"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Unit Cost ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-bold"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({...formData, unitCost: e.target.value})}
                  />
                </div>
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
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  {editingItem ? 'Update Material' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Stock Modal */}
      {/* ... keeping existing withdraw modal code ... */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingDown className="w-6 h-6 text-rose-500" />
                Withdraw Items
              </h2>
              <button 
                onClick={() => {
                  setIsWithdrawModalOpen(false);
                  setError(null);
                  setWithdrawData({ itemId: null, quantity: '' });
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

            <form onSubmit={handleWithdraw} className="space-y-6">
              <InventorySearchSelect 
                items={items}
                selectedItemId={withdrawData.itemId}
                onSelect={(item) => setWithdrawData({ ...withdrawData, itemId: item ? item.id : null })}
                label="Select Material to Withdraw"
              />

              {withdrawData.itemId && (
                <div className="animate-in slide-in-from-top-4 duration-300">
                  <label className="block text-slate-300 text-sm font-medium mb-2 ml-1">Quantity to Withdraw</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      min="1"
                      max={items.find(i => i.id === withdrawData.itemId)?.quantity}
                      placeholder="0"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-600/50 transition-all font-bold text-xl"
                      value={withdrawData.quantity}
                      onChange={(e) => setWithdrawData({...withdrawData, quantity: e.target.value})}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold uppercase">
                      Max: {items.find(i => i.id === withdrawData.itemId)?.quantity}
                    </div>
                  </div>
                  {parseInt(withdrawData.quantity) > (items.find(i => i.id === withdrawData.itemId)?.quantity || 0) && (
                    <p className="text-rose-500 text-xs mt-2 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Insufficient stock available
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!withdrawData.itemId || !withdrawData.quantity || parseInt(withdrawData.quantity) > (items.find(i => i.id === withdrawData.itemId)?.quantity || 0)}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-600/20 transition-all"
                >
                  Confirm Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
