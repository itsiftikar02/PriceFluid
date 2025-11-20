import React from 'react';
import { useQuery } from 'react-query';
import { getDashboardAnalytics, exportToExcel } from '../services/api';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package,
  Download,
  RefreshCw,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function StatCard({ title, value, icon: Icon, trend, trendDirection = 'up', color = 'violet' }) {
  const colorMap = {
    violet: { bg: 'from-violet-600/20 to-violet-400/5', border: 'border-violet-500/30', icon: 'text-violet-400' },
    blue: { bg: 'from-blue-600/20 to-blue-400/5', border: 'border-blue-500/30', icon: 'text-blue-400' },
    emerald: { bg: 'from-emerald-600/20 to-emerald-400/5', border: 'border-emerald-500/30', icon: 'text-emerald-400' },
    amber: { bg: 'from-amber-600/20 to-amber-400/5', border: 'border-amber-500/30', icon: 'text-amber-400' },
  };

  const colors = colorMap[color] || colorMap.violet;

  return (
    <div className={`stat-card bg-gradient-to-br ${colors.bg} border ${colors.border}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-3">{title}</p>
          <p className="text-4xl font-bold text-white mb-3">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${trendDirection === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {trendDirection === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-white/10 backdrop-blur-sm ${colors.icon}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [days, setDays] = React.useState(30);

  const { data: analytics, isLoading, error: analyticsError, refetch } = useQuery(
    ['dashboard', days],
    () => getDashboardAnalytics(days).then(res => res.data),
    {
      refetchInterval: 60000,
    }
  );

  const handleExport = async () => {
    try {
      const response = await exportToExcel({ days });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      link.setAttribute('download', `pricing_strategy_report_${timestamp}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      alert('Report exported successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report: ' + (error.response?.data?.error || error.message));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="card bg-red-500/10 border border-red-500/30">
        <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Dashboard</h2>
        <p className="text-slate-300 mb-4">{analyticsError.response?.data?.error || analyticsError.message}</p>
        <button onClick={() => refetch()} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-400 mb-4">No analytics data available</p>
        <button onClick={() => refetch()} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const { overall, by_category, elasticity_distribution, top_products } = analytics;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400 text-lg">Real-time pricing performance metrics</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="input w-full sm:w-auto"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={180}>Last 180 days</option>
          </select>
          <button onClick={handleExport} className="btn btn-primary flex items-center justify-center gap-2 whitespace-nowrap">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(overall?.total_revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          trend={`Last ${days} days`}
          trendDirection="up"
          color="emerald"
        />
        <StatCard
          title="Total Profit"
          value={`$${(overall?.total_profit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={TrendingUp}
          trend={`${overall?.avg_margin || 0}% margin`}
          trendDirection="up"
          color="violet"
        />
        <StatCard
          title="Units Sold"
          value={(overall?.total_quantity || 0).toLocaleString()}
          icon={Package}
          trend={`${overall?.products_sold || 0} products`}
          trendDirection="up"
          color="blue"
        />
        <StatCard
          title="Transactions"
          value={(overall?.total_transactions || 0).toLocaleString()}
          icon={ShoppingBag}
          trend={`Avg $${(overall?.total_revenue / (overall?.total_transactions || 1) || 0).toFixed(2)}`}
          trendDirection="up"
          color="amber"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Category - 2 columns */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-violet-400" />
              Revenue by Category
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={by_category || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
              <Tooltip 
                formatter={(value) => `$${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue" radius={[8, 8, 0, 0]} />
              <Bar dataKey="profit" fill="#10b981" name="Profit" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Elasticity Distribution - 1 column */}
        <div className="card">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Elasticity Distribution
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={elasticity_distribution || []}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                label={({ type, count }) => `${type}: ${count}`}
              >
                {(elasticity_distribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#f1f5f9' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-violet-400" />
            Top 10 Products by Revenue
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-violet-600/20 to-blue-600/20 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(top_products || []).map((product, index) => (
                <tr key={product.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{index + 1}</td>
                  <td className="px-6 py-4 text-slate-200">{product.name}</td>
                  <td className="px-6 py-4 text-right font-medium text-emerald-400">
                    ${product.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-300">
                    {((product.revenue / overall?.total_revenue) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
