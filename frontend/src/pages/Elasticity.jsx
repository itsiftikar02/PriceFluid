import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { getProducts, bulkCalculateElasticity } from '../services/api';
import { Calculator, TrendingUp, TrendingDown, Minus, RefreshCw, ChevronRight, Zap, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

function Elasticity() {
  const [calculating, setCalculating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [filterType, setFilterType] = useState('');

  const { data: productsData, refetch } = useQuery(
    ['products-with-elasticity'],
    () => getProducts({ per_page: 100, include_elasticity: true }).then(res => res.data)
  );

  const products = productsData?.products || [];

  const handleBulkCalculate = async () => {
    if (!confirm('Calculate elasticity for all products? This may take a few minutes.')) {
      return;
    }

    setCalculating(true);
    try {
      const result = await bulkCalculateElasticity({});
      setProgress(result.data);
      alert(`Calculation complete! ${result.data.total_calculated} products analyzed, ${result.data.total_errors} errors`);
      await refetch();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert('Bulk calculation failed: ' + errorMessage);
    } finally {
      setCalculating(false);
    }
  };

  const getElasticityIcon = (type) => {
    switch (type) {
      case 'elastic':
      case 'highly_elastic':
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      case 'inelastic':
        return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      case 'unit_elastic':
        return <Minus className="h-5 w-5 text-amber-400" />;
      default:
        return null;
    }
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

  const elasticProducts = products.filter(p => p.elasticity);
  const filteredProducts = filterType ? elasticProducts.filter(p => p.elasticity?.elasticity_type === filterType) : elasticProducts;
  
  const inelasticCount = elasticProducts.filter(p => p.elasticity?.elasticity_type === 'inelastic').length;
  const elasticCount = elasticProducts.filter(p => ['elastic', 'highly_elastic'].includes(p.elasticity?.elasticity_type)).length;
  const unitElasticCount = elasticProducts.filter(p => p.elasticity?.elasticity_type === 'unit_elastic').length;

  const StatSummaryCard = ({ title, count, description, color, icon: Icon }) => (
    <div className={`stat-card bg-gradient-to-br ${color}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">{title}</p>
          <p className="text-4xl font-bold text-white mb-1">{count}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
        <Icon className="h-8 w-8 text-white/20" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Elasticity Analysis</h1>
          <p className="text-slate-400 text-lg">Analyze price sensitivity and demand elasticity across products</p>
        </div>
        <button
          onClick={handleBulkCalculate}
          disabled={calculating}
          className="btn btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {calculating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4" />
          )}
          {calculating ? 'Calculating...' : 'Calculate All'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatSummaryCard
          title="Total Analyzed"
          count={elasticProducts.length}
          description={`of ${products.length} products`}
          color="from-violet-600/20 to-violet-400/5 border border-violet-500/30"
          icon={Zap}
        />
        <StatSummaryCard
          title="Inelastic"
          count={inelasticCount}
          description="Price insensitive"
          color="from-emerald-600/20 to-emerald-400/5 border border-emerald-500/30"
          icon={TrendingUp}
        />
        <StatSummaryCard
          title="Elastic"
          count={elasticCount}
          description="Price sensitive"
          color="from-red-600/20 to-red-400/5 border border-red-500/30"
          icon={TrendingDown}
        />
        <StatSummaryCard
          title="Unit Elastic"
          count={unitElasticCount}
          description="Balanced demand"
          color="from-amber-600/20 to-amber-400/5 border border-amber-500/30"
          icon={Minus}
        />
      </div>

      {/* Progress Card */}
      {progress && (
        <div className="card border-l-4 border-l-violet-500">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-violet-500/20 rounded-lg">
              <Zap className="h-6 w-6 text-violet-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-2">Latest Calculation Results</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Calculated</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{progress.total_calculated}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Errors</p>
                  <p className="text-2xl font-bold text-red-400 mt-1">{progress.total_errors}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Products Table */}
      <div className="card">
        <div className="mb-6 pb-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-violet-400" />
            Product Elasticity Breakdown
          </h2>
          
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filterType === ''
                  ? 'bg-violet-600 text-white shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              All ({elasticProducts.length})
            </button>
            <button
              onClick={() => setFilterType('inelastic')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                filterType === 'inelastic'
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Inelastic ({inelasticCount})
            </button>
            <button
              onClick={() => setFilterType('elastic')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                filterType === 'elastic'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <TrendingDown className="h-4 w-4" />
              Elastic ({elasticCount})
            </button>
            <button
              onClick={() => setFilterType('unit_elastic')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                filterType === 'unit_elastic'
                  ? 'bg-amber-600 text-white shadow-lg'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Minus className="h-4 w-4" />
              Unit ({unitElasticCount})
            </button>
          </div>
        </div>

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No elasticity data available</p>
            <p className="text-slate-500 mt-1">Click "Calculate All" to analyze products</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-violet-600/20 to-blue-600/20 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-4 text-center font-semibold text-violet-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Coefficient</th>
                  <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Optimal</th>
                  <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Impact</th>
                  <th className="px-6 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => {
                  const elasticity = product.elasticity;
                  return (
                    <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-white group-hover:text-violet-300 transition-colors">{product.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{product.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">{product.category}</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-200">${product.current_price}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`badge ${getElasticityBadgeColor(elasticity.elasticity_type)}`}>
                          {elasticity.elasticity_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getElasticityIcon(elasticity.elasticity_type)}
                          <span className="font-mono font-bold">{elasticity.elasticity_coefficient.toFixed(3)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-violet-300">
                        ${elasticity.optimal_price ? elasticity.optimal_price.toFixed(2) : 'N/A'}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${
                        (elasticity.expected_revenue_change ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {(elasticity.expected_revenue_change ?? 0) >= 0 ? '+' : ''}
                        {elasticity.expected_revenue_change !== null ? elasticity.expected_revenue_change.toFixed(1) : 'N/A'}%
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-300">
                            {elasticity.recommended_action || 'Monitor'}
                          </span>
                          <Link
                            to={`/products/${product.id}`}
                            className="text-violet-400 hover:text-violet-300 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Understanding Elasticity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card border-l-4 border-l-emerald-500">
          <div className="flex items-start gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-emerald-400 flex-shrink-0" />
            <h3 className="font-bold text-white">Inelastic (|e| &lt; 1)</h3>
          </div>
          <p className="text-slate-300 text-sm">Demand is insensitive to price changes. Customers buy regardless of price. Strategy: Increase prices to boost revenue and profit margins.</p>
        </div>

        <div className="card border-l-4 border-l-red-500">
          <div className="flex items-start gap-3 mb-4">
            <TrendingDown className="h-6 w-6 text-red-400 flex-shrink-0" />
            <h3 className="font-bold text-white">Elastic (|e| &gt; 1)</h3>
          </div>
          <p className="text-slate-300 text-sm">Demand is sensitive to price changes. Small price increases reduce sales significantly. Strategy: Consider price reductions to increase volume and revenue.</p>
        </div>

        <div className="card border-l-4 border-l-amber-500">
          <div className="flex items-start gap-3 mb-4">
            <Minus className="h-6 w-6 text-amber-400 flex-shrink-0" />
            <h3 className="font-bold text-white">Unit Elastic (|e| ≈ 1)</h3>
          </div>
          <p className="text-slate-300 text-sm">Revenue impact is neutral to price changes. Quantity sold changes proportionally with price. Strategy: Focus on cost optimization or value-added services.</p>
        </div>
      </div>
    </div>
  );
}

export default Elasticity;
