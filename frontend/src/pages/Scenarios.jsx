import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { getScenarios, compareScenarios, getProducts, simulateScenario } from '../services/api';
import { Play, GitCompare, TrendingUp, TrendingDown, DollarSign, Zap, Check, AlertCircle } from 'lucide-react';

function Scenarios() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [simulationDays, setSimulationDays] = useState(30);
  const [simulating, setSimulating] = useState(false);
  const [selectedScenarios, setSelectedScenarios] = useState([]);

  const { data: productsData } = useQuery(
    'products-scenarios',
    () => getProducts({ per_page: 100 }).then(res => res.data)
  );

  const { data: scenariosData, refetch } = useQuery(
    'scenarios',
    () => getScenarios({ limit: 50 }).then(res => res.data)
  );

  const { data: comparison } = useQuery(
    ['compare-scenarios', selectedScenarios],
    () => compareScenarios(selectedScenarios).then(res => res.data),
    { enabled: selectedScenarios.length >= 2 }
  );

  const products = productsData?.products || [];
  const scenarios = scenariosData?.scenarios || [];

  const handleSimulate = async () => {
    if (!selectedProduct || !newPrice) {
      alert('Please select a product and enter a price');
      return;
    }

    setSimulating(true);
    try {
      const selectedProd = products.find(p => p.id === parseInt(selectedProduct));
      await simulateScenario({
        product_id: parseInt(selectedProduct),
        new_price: parseFloat(newPrice),
        simulation_days: simulationDays
      });
      await refetch();
      setSelectedProduct('');
      setNewPrice('');
      alert('Scenario created successfully!');
    } catch (error) {
      alert('Simulation failed: ' + error.response?.data?.error);
    } finally {
      setSimulating(false);
    }
  };

  const toggleScenarioSelection = (id) => {
    setSelectedScenarios(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getRecommendationColor = (action) => {
    if (action === 'Highly Recommended') return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300';
    if (action === 'Recommended') return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
    if (action === 'Consider') return 'bg-amber-500/20 border-amber-500/30 text-amber-300';
    return 'bg-red-500/20 border-red-500/30 text-red-300';
  };

  const selectedProduct_obj = products.find(p => p.id === parseInt(selectedProduct));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">What-If Scenarios</h1>
        <p className="text-slate-400 text-lg">Simulate pricing strategies and compare outcomes</p>
      </div>

      {/* Scenario Creator */}
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Zap className="h-5 w-5 text-violet-400" />
          Create New Scenario
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Select Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="input w-full"
            >
              <option value="">Choose a product...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (${product.current_price})
                </option>
              ))}
            </select>
          </div>

          {/* New Price */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">New Price ($)</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="input w-full"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Duration (days)</label>
            <select
              value={simulationDays}
              onChange={(e) => setSimulationDays(Number(e.target.value))}
              className="input w-full"
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {/* Run Button */}
          <div className="flex items-end">
            <button
              onClick={handleSimulate}
              disabled={simulating || !selectedProduct || !newPrice}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4" />
              {simulating ? 'Running...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Price Preview */}
        {selectedProduct_obj && newPrice && (
          <div className="mt-4 pt-4 border-t border-white/10 bg-white/5 rounded-lg p-3">
            <p className="text-sm text-slate-400 mb-2">Price change preview:</p>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">{selectedProduct_obj.name}</span>
              <div className="flex items-center gap-3 text-lg font-bold">
                <span className="text-slate-400">${selectedProduct_obj.current_price}</span>
                <TrendingUp className="h-5 w-5 text-violet-400" />
                <span className="text-violet-400">${newPrice}</span>
                <span className="text-sm text-slate-400">
                  ({(((parseFloat(newPrice) - selectedProduct_obj.current_price) / selectedProduct_obj.current_price) * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {selectedScenarios.length >= 2 && comparison && (
        <div className="card border-l-4 border-l-violet-500">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-violet-400" />
            Comparison Results ({selectedScenarios.length} scenarios)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Best for Revenue */}
            <div className="card bg-gradient-to-br from-emerald-600/20 to-emerald-400/5 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-white">Best Revenue</h3>
              </div>
              <p className="text-sm text-slate-300 mb-2">{comparison.best_for_revenue?.name}</p>
              <div className="text-2xl font-bold text-emerald-400">
                +{comparison.best_for_revenue?.revenue?.revenue_change_percent.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ${comparison.best_for_revenue?.revenue?.total_revenue_change.toLocaleString()}
              </p>
            </div>

            {/* Best for Profit */}
            <div className="card bg-gradient-to-br from-violet-600/20 to-violet-400/5 border border-violet-500/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-5 w-5 text-violet-400" />
                <h3 className="font-bold text-white">Best Profit</h3>
              </div>
              <p className="text-sm text-slate-300 mb-2">{comparison.best_for_profit?.name}</p>
              <div className="text-2xl font-bold text-violet-400">
                +{comparison.best_for_profit?.profit?.profit_change_percent.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                ${comparison.best_for_profit?.profit?.total_profit_change.toLocaleString()}
              </p>
            </div>

            {/* Best for Volume */}
            <div className="card bg-gradient-to-br from-blue-600/20 to-blue-400/5 border border-blue-500/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white">Best Volume</h3>
              </div>
              <p className="text-sm text-slate-300 mb-2">{comparison.best_for_volume?.name}</p>
              <div className="text-2xl font-bold text-blue-400">
                +{comparison.best_for_volume?.demand?.quantity_change_percent.toFixed(1)}%
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Demand increase
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenarios Table */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-violet-400" />
            Recent Scenarios
          </h2>
          
          {selectedScenarios.length >= 2 && (
            <div className="badge badge-info">
              {selectedScenarios.length} selected for comparison
            </div>
          )}
        </div>

        {scenarios.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 text-lg mb-1">No scenarios yet</p>
            <p className="text-slate-500">Create your first what-if scenario above</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-violet-600/20 to-blue-600/20 border-b border-white/10">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedScenarios(scenarios.map(s => s.id));
                        } else {
                          setSelectedScenarios([]);
                        }
                      }}
                      checked={selectedScenarios.length === scenarios.length && scenarios.length > 0}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">Scenario</th>
                  <th className="px-6 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Price Change</th>
                  <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Profit</th>
                  <th className="px-6 py-4 text-right font-semibold text-violet-300 uppercase tracking-wider">Volume</th>
                  <th className="px-6 py-4 text-left font-semibold text-violet-300 uppercase tracking-wider">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {scenarios.map((scenario) => (
                  <tr
                    key={scenario.id}
                    className={`hover:bg-white/5 transition-colors ${selectedScenarios.includes(scenario.id) ? 'bg-violet-500/10' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedScenarios.includes(scenario.id)}
                        onChange={() => toggleScenarioSelection(scenario.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-white">{scenario.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{scenario.product_name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${scenario.pricing.price_change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {scenario.pricing.price_change_percent >= 0 ? '+' : ''}{scenario.pricing.price_change_percent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">
                        ${scenario.pricing.current_price.toFixed(2)} → ${scenario.pricing.new_price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${scenario.revenue.revenue_change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {scenario.revenue.revenue_change_percent >= 0 ? '+' : ''}{scenario.revenue.revenue_change_percent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">
                        ${scenario.revenue.total_revenue_change.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${scenario.profit.profit_change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {scenario.profit.profit_change_percent >= 0 ? '+' : ''}{scenario.profit.profit_change_percent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-500">
                        ${scenario.profit.total_profit_change.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`font-bold ${scenario.demand.quantity_change_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {scenario.demand.quantity_change_percent >= 0 ? '+' : ''}{scenario.demand.quantity_change_percent.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getRecommendationColor(scenario.recommendation?.action)}`}>
                        {scenario.recommendation?.action || 'Monitor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Scenarios;
