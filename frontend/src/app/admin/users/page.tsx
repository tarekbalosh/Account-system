// src/app/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { User } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/components/ui/toast';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Trash2, 
  Loader2,
  AlertCircle,
  Edit2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'ACCOUNTANT'
  });

  const fetchUsers = async () => {
    try {
      const response = await api.get<User[]>('/users');
      setUsers(response.data);
    } catch (err) {
      toast('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [currentUser]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload: any = { ...formData };
        if (!payload.password) delete payload.password;
        await api.patch(`/users/${editingUser.id}`, payload);
        toast('User updated successfully', 'success');
      } else {
        await api.post('/users', formData);
        toast('User created successfully', 'success');
      }
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', role: 'ACCOUNTANT' });
      fetchUsers();
    } catch (err: any) {
      toast(err.response?.data?.message || `Failed to ${editingUser ? 'update' : 'create'} user`, 'error');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        toast('User deleted successfully', 'success');
        fetchUsers();
      } catch (err) {
        toast('Failed to delete user', 'error');
      }
    }
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({
      email: u.email,
      password: '',
      role: u.role
    });
    setIsModalOpen(true);
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <Shield className="w-16 h-16 text-slate-800 mb-4" />
        <h2 className="text-2xl font-bold text-white">Access Denied</h2>
        <p className="text-slate-500 max-w-sm mx-auto mt-2">
          Only administrators can access the user management module.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Access Control</h1>
          <p className="text-slate-400 mt-1">Manage staff accounts and system permissions.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin mx-auto w-8 h-8 text-blue-500" /></div>
        ) : (
          users.map((u) => (
            <div key={u.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  <Shield className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => openEditModal(u)}
                    className="p-2 text-slate-600 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                    title="Edit User"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {u.id !== currentUser.id && (
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-white font-bold mb-1 truncate">{u.email}</p>
              <p className={`text-xs font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'text-amber-500' : 'text-blue-500'}`}>
                {u.role}
              </p>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-8 animate-in zoom-in-95">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingUser ? 'Edit Staff Account' : 'Create New Staff Account'}
            </h2>
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase mb-1.5 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                  <input 
                    type="email" required placeholder="staff@restaurant.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase mb-1.5 ml-1">
                  Password {editingUser && '(Leave blank to keep current)'}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required={!editingUser} 
                    minLength={6} 
                    placeholder={editingUser ? '••••••••' : 'Password'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all pr-12"
                    value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase mb-1.5 ml-1">Role</label>
                <select 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50"
                  value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="flex-1 bg-slate-800 text-slate-400 font-bold py-3 rounded-xl transition-colors hover:bg-slate-700">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
