'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import { AuthResponse } from '@/lib/types';
import { LogIn, Key, Mail, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      // ✅ Only call login, AuthProvider handles the redirect
      login(res.data.accessToken, res.data.user);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">

        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-blue-500/10 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] -mr-16 -mt-16" />

          {/* HEADER */}
          <div className="flex flex-col items-center mb-10 relative z-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-blue-600/20 rotate-3">
              <LogIn className="text-white w-10 h-10 -rotate-3" />
            </div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Sign In</h1>
            <p className="text-slate-400 font-medium">Access your financial intelligence</p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center mb-8 text-sm font-bold animate-shake">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">

            {/* EMAIL */}
            <div className="space-y-2">
              <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest ml-4">
                Email Address
              </label>

              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />

                <input
                  type="email"
                  required
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-14 pr-5 text-white font-bold placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  placeholder="admin@accounting.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <label className="block text-slate-400 text-[10px] font-black uppercase tracking-widest ml-4">
                Password
              </label>

              <div className="relative group">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />

                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-14 pr-14 text-white font-bold placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-black py-5 rounded-2xl flex items-center justify-center transition-all active:scale-[0.98] shadow-xl shadow-blue-600/20 group"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-2 uppercase tracking-widest text-xs">
                  SIGN IN
                  <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-10 pt-8 border-t border-white/5 text-center relative z-10">
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
              Precision Accounting System v2.0
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}