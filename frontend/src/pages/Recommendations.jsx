import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { getRecommendations, getCategories } from '../services/api';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowRight, Download, Zap, AlertCircle, CheckCircle } from 'lucide-react';

function Recommendations() {
  const [category, setCategory] = useState('');

  const { data: recommendationsData, isLoading } = useQuery(
    ['recommendations', category],
    () => getRecommendations({ category }).then(res => res.data)
  );

  const { data: categoriesData } = useQuery(
    'categories-rec',
    () => getCategories().then(res => res.data)
  );

  const recommendations = recommendationsData?.recommendations || [];
  const categories = categoriesData?.categories || [];

  const getActionIcon = (action) => {
    if (!action) return null;
    if (action.toLowerCase().includes('increase')) {
      return <TrendingUp className="h-5 w-5 text-emerald-400" />;
    }
    return <TrendingDown className="h-5 w-5 text-red-400" />;
  };

  const getElasticityBadgeColor = (type) => {
    switch (type) {
      case 'elastic':
      case 'highly_elastic':
        return 'badge-danger';
      case 'inelastic':
        return 'badge-success';
      case 'unit_elastic':
        return 'badge-warning';
      default:
        return 'badge';
    }
  };

  // Group recommendations by impact
  const highImpact = recommendations.filter(r => (r.expected_revenue_change || 0) > 10);
  const mediumImpact = recommendations.filter(r => (r.expected_revenue_change || 0) > 5 && (r.expected_revenue_change || 0) <= 10);
  const lowImpact = recommendations.filter(r => (r.expected_revenue_change || 0) <= 5);

  const handleExportReport = () => {
    const headers = ['Product Name', 'SKU', 'Category', 'Current Price', 'Optimal Price', 'Action', 'Expected Revenue Change', 'Impact Level'];
    const csvContent = [
      headers.join(','),
      ...recommendations.map(rec => [
        `"${rec.product_name || ''}"`,
        rec.sku || '',
        rec.category || '',
        rec.current_price || '',
        rec.optimal_price || '',
        `"${rec.recommended_action || ''}"`,
        `${rec.expected_revenue_change || 0}%`,
        (rec.expected_revenue_change || 0) > 10 ? 'High' : (rec.expected_revenue_change || 0) > 5 ? 'Medium' : 'Low'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pricing_recommendations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Price Recommendations</h1>
          <p className="text-slate-400 text-lg">AI-powered optimal pricing strategies for maximum revenue</p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-300 mb-3">Filter by Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-full"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleExportReport}
              disabled={recommendations.length === 0}
              className="btn btn-primary w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card bg-gradient-to-br from-red-600/20 to-red-400/5 border border-red-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">High Impact</p>
              <p className="text-4xl font-bold text-white mb-1">{highImpact.length}</p>
              <p className="text-xs text-slate-400">&gt;10% revenue impact</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-400/50" />
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-amber-600/20 to-amber-400/5 border border-amber-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Medium Impact</p>
              <p className="text-4xl font-bold text-white mb-1">{mediumImpact.length}</p>
              <p className="text-xs text-slate-400">5-10% revenue impact</p>
            </div>
            <Zap className="h-8 w-8 text-amber-400/50" />
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-emerald-600/20 to-emerald-400/5 border border-emerald-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Low Impact</p>
              <p className="text-4xl font-bold text-white mb-1">{lowImpact.length}</p>
              <p className="text-xs text-slate-400">&lt;5% revenue impact</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-400/50" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="card text-center py-20">
          <Zap className="h-12 w-12 animate-pulse text-violet-400 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading recommendations...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="card text-center py-16">
          <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-300 text-lg mb-1">No recommendations available</p>
          <p className="text-slate-500">Calculate elasticity for products first in the Elasticity section</p>
        </div>
      ) : (
        <>
          {/* High Priority Recommendations */}
          {highImpact.length > 0 && (
            <div className="card border-l-4 border-l-red-500">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="h-6 w-6 text-red-400" />
                <h2 className="text-xl font-bold text-white">High Priority - Act Now</h2>
                <span className="badge badge-danger ml-auto">{highImpact.length} opportunities</span>
              </div>

              <div className="space-y-4">
                {highImpact.map((rec) => {
                  const priceChange = ((rec.optimal_price - rec.current_price) / rec.current_price) * 100;
                  return (
                    <div key={rec.product_id} className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-all border border-white/10">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-center">
                        {/* Product Info */}
                        <div className="lg:col-span-2">
                          <h3 className="font-bold text-white text-lg mb-1">{rec.product_name}</h3>
                          <p className="text-sm text-slate-400">{rec.category}</p>
                        </div>

                        {/* Price Comparison */}
                        <div className="text-center">
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Current</p>
                          <p className="text-xl font-bold text-slate-200">${(rec.current_price ?? 0).toFixed(2)}</p>
                        </div>

                        <div className="flex justify-center">
                          {getActionIcon(rec.recommended_action)}
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Optimal</p>
                          <p className="text-xl font-bold text-violet-400">${(rec.optimal_price ?? rec.current_price ?? 0).toFixed(2)}</p>
                          <p className={`text-sm mt-1 ${priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                          </p>
                        </div>

                        {/* Impact & Link */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-center">
                            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Revenue Impact</p>
                            <p className="text-xl font-bold text-emerald-400">+{((rec.expected_revenue_change ?? 0).toFixed(1))}%</p>
                          </div>
                          <Link
                            to={`/products/${rec.product_id}`}
                            className="btn btn-primary flex-shrink-0"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Recommendations Table */}
          <div className="card">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="h-5 w-5 text-violet-400" />
              All Recommendations ({recommendations.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-violet-600/20 to-blue-600/20 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Current</th>
                    <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Optimal</th>
                    <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Change</th>
                    <th className="px-6 py-4 text-center font-semibold text-violet-300 uppercase tracking-wider">Elasticity</th>
                    <th className="px-6 py-4 text-center font-semibold text-violet-300 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recommendations.map((rec) => {
                    const priceChange = ((rec.optimal_price - rec.current_price) / rec.current_price) * 100;
                    return (
                      <tr key={rec.product_id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <Link
                            to={`/products/${rec.product_id}`}
                            className="font-semibold text-white group-hover:text-violet-300 transition-colors"
                          >
                            {rec.product_name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-300">{rec.category}</td>
                        <td className="px-6 py-4 text-right text-slate-300">
                          ${(rec.current_price ?? 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-violet-300">
                          ${(rec.optimal_price ?? rec.current_price ?? 0).toFixed(2)}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${
                          priceChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`badge ${getElasticityBadgeColor(rec.elasticity_type)}`}>
                            {rec.elasticity_type || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getActionIcon(rec.recommended_action)}
                            <span className="text-slate-300">{rec.recommended_action || 'Monitor'}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-right font-bold ${
                          (rec.expected_revenue_change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {(rec.expected_revenue_change ?? 0) >= 0 ? '+' : ''}{(rec.expected_revenue_change ?? 0).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Recommendations;
