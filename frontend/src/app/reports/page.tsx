// src/app/reports/page.tsx
'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { ProfitLossReport } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { 
  FileText, 
  BarChart3, 
  Download, 
  Calendar,
  Loader2,
  PieChart,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [dates, setDates] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await api.get<ProfitLossReport>('/reports/profit-loss', {
        params: { from: dates.from, to: dates.to }
      });
      setReport(response.data);
    } catch (err) {
      console.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type: 'pdf' | 'excel') => {
    setExporting(type);
    try {
      const response = await api.get(`/reports/export/${type}`, {
        params: { from: dates.from, to: dates.to },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${dates.from}-to-${dates.to}.${type === 'pdf' ? 'pdf' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to export ${type}`, err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Financial Reports</h1>
          <p className="text-slate-400 mt-1">Generate and export profit and loss statements.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => exportReport('excel')}
            disabled={!report || exporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700/50 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-w-[100px] justify-center"
          >
            {exporting === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Excel
          </button>
          <button 
            onClick={() => exportReport('pdf')}
            disabled={!report || exporting !== null}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700/50 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-w-[100px] justify-center"
          >
            {exporting === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            PDF
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
        <div className="flex flex-col md:flex-row items-end gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3 text-blue-500" /> From Date
            </label>
            <input 
              type="date" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium"
              value={dates.from}
              onChange={(e) => setDates({ ...dates, from: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-center pb-4 hidden md:block">
            <ArrowRight className="text-slate-700 w-6 h-6" />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="w-3 h-3 text-blue-500" /> To Date
            </label>
            <input 
              type="date" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all font-medium"
              value={dates.to}
              onChange={(e) => setDates({ ...dates, to: e.target.value })}
            />
          </div>
          <button 
            onClick={fetchReport}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-8 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
            Generate Report
          </button>
        </div>
      </div>

      {/* Report Results */}
      {report && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingUp className="w-24 h-24 text-emerald-500" />
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Total Revenue</p>
              <h3 className="text-3xl font-black text-white">{formatCurrency(report.totalRevenue)}</h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <TrendingDown className="w-24 h-24 text-rose-500" />
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Total Expenses</p>
              <h3 className="text-3xl font-black text-white">{formatCurrency(report.totalExpenses)}</h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative overflow-hidden group border-blue-500/30">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <PieChart className="w-24 h-24 text-blue-500" />
              </div>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Net Profit</p>
              <h3 className={`text-3xl font-black ${report.netProfit >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                {formatCurrency(report.netProfit)}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Profit & Loss Statement
              </h3>
              <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-full text-xs font-bold uppercase tracking-widest">
                Official Document Preview
              </span>
            </div>
            <div className="p-12 space-y-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between group">
                  <span className="text-slate-400 font-medium">Gross Revenue</span>
                  <div className="flex-1 mx-8 border-b border-dotted border-slate-800 group-hover:border-slate-700 transition-all"></div>
                  <span className="text-white font-bold">{formatCurrency(report.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between group">
                  <span className="text-slate-400 font-medium font-bold text-rose-400/80 italic">General Expenses</span>
                  <div className="flex-1 mx-8 border-b border-dotted border-slate-800"></div>
                  <span className="text-rose-400 font-bold">({formatCurrency(report.generalExpenses)})</span>
                </div>
                <div className="flex items-center justify-between group">
                  <span className="text-slate-400 font-medium font-bold text-rose-400/80 italic">Consumption Materials</span>
                  <div className="flex-1 mx-8 border-b border-dotted border-slate-800"></div>
                  <span className="text-rose-400 font-bold">({formatCurrency(report.consumptionMaterials)})</span>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800 flex items-center justify-between">
                <span className="text-2xl font-black text-white uppercase tracking-tighter">Net Operating Profit</span>
                <span className={`text-3xl font-black ${report.netProfit >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                   {formatCurrency(report.netProfit)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-medium italic">
            <AlertCircle className="w-4 h-4" />
            Values are calculated based on recorded transactions within the selected period.
          </div>
        </div>
      )}

      {!report && !loading && (
        <div className="py-24 text-center space-y-4">
          <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-700 mb-6 group hover:scale-110 transition-transform">
            <BarChart3 className="w-10 h-10 group-hover:text-blue-600 transition-colors" />
          </div>
          <h2 className="text-2xl font-bold text-white">Select a period to generate reports.</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Choose your reporting period above and click "Generate Report" to visualize your restaurant's financial health.
          </p>
        </div>
      )}
    </div>
  );
}
