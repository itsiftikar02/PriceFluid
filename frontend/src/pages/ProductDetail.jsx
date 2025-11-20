import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import {
  getProduct,
  getSalesSummary,
  getProductElasticity,
  calculateElasticity,
  getElasticityCurve,
  simulateScenario
} from '../services/api';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Package,
  Calculator,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Error Boundary for catching rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ProductDetail render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="space-y-8">
          <div className="flex items-start justify-between gap-4">
            <Link to="/products" className="btn btn-secondary">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="card bg-red-950/20 border border-red-500/30 p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-red-400 font-semibold">Error loading product details</p>
                <p className="text-red-300 text-sm mt-1">{this.state.error?.message}</p>
                <Link to="/products" className="btn btn-secondary mt-4">Back to Products</Link>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function ProductDetail() {
  const { id } = useParams();
  const [calculating, setCalculating] = useState(false);
  const [simulationPrice, setSimulationPrice] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  const { data: product, isLoading: productLoading, error: productError } = useQuery(
    ['product', id],
    () => getProduct(id).then(res => res.data),
    { 
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    }
  );

  const { data: salesSummary, error: salesError } = useQuery(
    ['sales-summary', id],
    () => getSalesSummary({ product_id: id, days: 90 }).then(res => res.data),
    { 
      enabled: !!id, 
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    }
  );

  const { data: elasticity, refetch: refetchElasticity, error: elasticityError, isLoading: elasticityLoading } = useQuery(
    ['elasticity', id],
    () => getProductElasticity(id).then(res => res.data).catch(err => {
      // If 404, return null instead of throwing
      if (err.response?.status === 404) {
        return null;
      }
      // Log error but return null to prevent crash
      console.error('Elasticity error:', err);
      return null;
    }),
    { 
      enabled: !!product && !!id, 
      retry: 1,
      retryDelay: 500,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      onError: (err) => {
        console.error('Elasticity query error:', err);
      }
    }
  );

  const { data: curveData, error: curveError, isLoading: curveLoading } = useQuery(
    ['elasticity-curve', id],
    () => getElasticityCurve(id).then(res => res.data).catch(err => {
      // If 404 or no elasticity, return null instead of throwing
      if (err.response?.status === 404) {
        return null;
      }
      // Log error but return null to prevent crash
      console.error('Curve error:', err);
      return null;
    }),
    { 
      enabled: !!elasticity && !!id && elasticity !== null, 
      retry: 1,
      retryDelay: 500,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      onError: (err) => {
        console.error('Curve query error:', err);
      }
    }
  );

  // Move handlers up here (before early returns cause issues)
  const handleCalculateElasticity = async () => {
    setCalculating(true);
    try {
      console.log('🚀 Starting elasticity calculation for product:', id);
        // Use linear_regression by default (matches bulk calculation on Elasticity page).
        // Gradient boosting can be more fragile on small samples and may cause server errors.
        const response = await calculateElasticity({
          product_id: parseInt(id),
          model_type: 'linear_regression'
        });
      console.log('✅ Elasticity calculation response:', response);
      await refetchElasticity();
      alert('Elasticity calculated successfully!');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      const errorStatus = error.response?.status;
      console.error('❌ Elasticity calculation error:', {
        message: errorMessage,
        status: errorStatus,
        response: error.response?.data,
        fullError: error
      });
      alert('Failed to calculate elasticity: ' + errorMessage);
    } finally {
      setCalculating(false);
    }
  };

  const handleSimulate = async () => {
    if (!simulationPrice || simulationPrice <= 0) {
      alert('Please enter a valid price');
      return;
    }
    try {
      const result = await simulateScenario({
        product_id: parseInt(id),
        new_price: parseFloat(simulationPrice),
        simulation_days: 30
      });
      setSimulationResult(result.data);
    } catch (error) {
      alert('Simulation failed: ' + error.response?.data?.error);
    }
  };

  // Log errors for debugging but don't crash the page
  React.useEffect(() => {
    if (productError) {
      console.error('Product API error:', productError);
    }
    if (salesError) {
      console.error('Sales summary API error:', salesError);
    }
  }, [productError, salesError]);

  if (productError) {
    console.error('Product API error:', productError);
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <Link to="/products" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="card bg-red-950/20 border border-red-500/30 p-6">
          <p className="text-red-400">Error loading product: {productError.message}</p>
          <Link to="/products" className="btn btn-secondary mt-4">Back to Products</Link>
        </div>
      </div>
    );
  }

  if (productLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-4">
          <Link to="/products" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="card">Product not found</div>
      </div>
    );
  }

  // Defensive: fallback values for product fields
  let safeProduct = {
    name: '',
    sku: '',
    category: '',
    current_price: 0,
    unit_cost: 0,
    margin: 0,
  };
  if (product) {
    safeProduct = {
      name: product.name || 'N/A',
      sku: product.sku || 'N/A',
      category: product.category || 'N/A',
      current_price: product.current_price ?? 0,
      unit_cost: product.unit_cost ?? 0,
      margin: product.margin ?? 0,
      ...product
    };
  }

  // Defensive: fallback values for salesSummary
  const safeSalesSummary = salesSummary || { total_quantity: 0, total_transactions: 0, total_revenue: 0, total_profit: 0 };

  // Defensive: fallback values for elasticity
  const safeElasticity = elasticity || {
    elasticity_coefficient: 0,
    elasticity_type: 'N/A',
    optimal_price: 0,
    expected_revenue_change: 0,
    recommended_action: '',
  };

  // Defensive: fallback for curveData
  let chartData = [];
  try {
    if (
      curveData &&
      Array.isArray(curveData.prices) &&
      Array.isArray(curveData.quantities) &&
      Array.isArray(curveData.revenues) &&
      Array.isArray(curveData.profits)
    ) {
      chartData = curveData.prices.map((price, i) => ({
        price: price?.toFixed(2) ?? '',
        quantity: curveData.quantities[i]?.toFixed(0) ?? '',
        revenue: curveData.revenues[i]?.toFixed(0) ?? '',
        profit: curveData.profits[i]?.toFixed(0) ?? ''
      }));
    }
  } catch (err) {
    console.error('Error preparing chart data:', err);
    chartData = [];
  }

  // Defensive: fallback for simulationResult
  const safeSimulationResult = simulationResult || {
    revenue: { revenue_change_percent: 0, total_revenue_change: 0 },
    profit: { profit_change_percent: 0, total_profit_change: 0 },
    recommendation: { action: 'N/A', risk_level: 'N/A' },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link to="/products" className="btn btn-secondary mt-1 flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">{safeProduct.name}</h1>
            <p className="text-slate-400 mt-2">{safeProduct.sku} • {safeProduct.category}</p>
          </div>
        </div>
      </div>

      {/* Product Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card bg-gradient-to-br from-violet-600/20 to-violet-400/5 border border-violet-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Current Price</p>
              <p className="text-3xl font-bold text-white mb-1">${(safeProduct.current_price ?? 0).toFixed(2)}</p>
              <p className="text-sm text-slate-400">Cost: ${(safeProduct.unit_cost ?? 0).toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-violet-400/50" />
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-emerald-600/20 to-emerald-400/5 border border-emerald-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Profit Margin</p>
              <p className="text-3xl font-bold text-emerald-400 mb-1">{(safeProduct.margin ?? 0).toFixed(1)}%</p>
              <p className="text-sm text-slate-400">${((safeProduct.current_price ?? 0) - (safeProduct.unit_cost ?? 0)).toFixed(2)} per unit</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-400/50" />
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-blue-600/20 to-blue-400/5 border border-blue-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Total Sales (90d)</p>
              <p className="text-3xl font-bold text-blue-400 mb-1">{(safeSalesSummary.total_quantity ?? 0).toLocaleString()}</p>
              <p className="text-sm text-slate-400">{(safeSalesSummary.total_transactions ?? 0).toLocaleString()} transactions</p>
            </div>
            <Package className="h-8 w-8 text-blue-400/50" />
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-cyan-600/20 to-cyan-400/5 border border-cyan-500/30">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Revenue (90d)</p>
              <p className="text-3xl font-bold text-cyan-400 mb-1">${(safeSalesSummary.total_revenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-sm text-slate-400">Profit: ${(safeSalesSummary.total_profit ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Elasticity Section */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-400" />
              Price Elasticity Analysis
            </h2>
            <p className="text-slate-400 mt-1">Understand how price changes affect demand</p>
          </div>
          <button
            onClick={handleCalculateElasticity}
            disabled={calculating}
            className="btn btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {calculating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Calculator className="h-4 w-4" />
            )}
            {calculating ? 'Calculating...' : 'Calculate'}
          </button>
        </div>

        {elasticity ? (
          <div className="space-y-6">
            {/* Elasticity Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Coefficient</p>
                <p className="text-3xl font-bold text-violet-400 mb-1">{((safeElasticity.elasticity_coefficient ?? 0) * 1).toFixed(3)}</p>
                <span className="badge text-xs">{safeElasticity.elasticity_type || 'N/A'}</span>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Optimal Price</p>
                <p className="text-3xl font-bold text-emerald-400 mb-1">
                  ${((safeElasticity.optimal_price ?? safeProduct.current_price ?? 0) * 1).toFixed(2)}
                </p>
                <p className="text-sm text-slate-400">
                  {safeElasticity.optimal_price ? (((safeElasticity.optimal_price - (safeProduct.current_price ?? 0)) / (safeProduct.current_price ?? 1) * 100) || 0).toFixed(1) : '0'}% change
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Revenue Impact</p>
                <p className={`text-3xl font-bold mb-1 ${((safeElasticity.expected_revenue_change ?? 0) * 1) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {((safeElasticity.expected_revenue_change ?? 0) * 1) >= 0 ? '+' : ''}{(((safeElasticity.expected_revenue_change ?? 0) * 1) || 0).toFixed(1)}%
                </p>
                <p className="text-sm text-slate-400">{safeElasticity.recommended_action || 'Monitor'}</p>
              </div>
            </div>

            {/* Elasticity Curve */}
            {chartData.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4">Demand Curve Analysis</h3>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis 
                        dataKey="price" 
                        stroke="#94a3b8"
                        label={{ value: 'Price ($)', position: 'bottom', offset: 0, fill: '#94a3b8' }}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        yAxisId="left"
                        stroke="#94a3b8"
                        label={{ value: 'Quantity', angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8' }}
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right"
                        stroke="#94a3b8"
                        label={{ value: 'Revenue ($)', angle: 90, position: 'insideRight', offset: 10, fill: '#94a3b8' }}
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '12px', color: '#f1f5f9' }}
                      />
                      <Legend wrapperStyle={{ color: '#94a3b8', paddingTop: '20px' }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="quantity"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Demand"
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Revenue"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white/5 rounded-lg border border-white/10">
            <Calculator className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-300 text-lg mb-1">No elasticity data yet</p>
            <p className="text-slate-500">Click "Calculate" to analyze this product's price sensitivity</p>
          </div>
        )}
      </div>

      {/* What-If Simulator */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">What-If Scenario Simulator</h2>
          {elasticity && (
            <span className="text-sm text-slate-400">Based on elasticity analysis</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">Test New Price</label>
            <input
              type="number"
              value={simulationPrice}
              onChange={(e) => setSimulationPrice(e.target.value)}
              placeholder={`Current: $${(safeProduct.current_price ?? 0).toFixed(2)}`}
              step="0.01"
              min="0"
              className="input w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSimulate}
              disabled={!elasticity || !simulationPrice}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Simulate
            </button>
          </div>
        </div>

        {simulationResult && (
          <div className="bg-gradient-to-r from-violet-600/20 to-blue-600/20 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">Simulation Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Revenue Change</p>
                <p className={`text-2xl font-bold mb-1 ${((simulationResult.revenue?.revenue_change_percent ?? 0) * 1) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {((simulationResult.revenue?.revenue_change_percent ?? 0) * 1) >= 0 ? '+' : ''}{(((simulationResult.revenue?.revenue_change_percent ?? 0) * 1) || 0).toFixed(1)}%
                </p>
                <p className="text-sm text-slate-400">
                  ${((simulationResult.revenue?.total_revenue_change ?? 0) * 1).toLocaleString()}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Profit Change</p>
                <p className={`text-2xl font-bold mb-1 ${((simulationResult.profit?.profit_change_percent ?? 0) * 1) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {((simulationResult.profit?.profit_change_percent ?? 0) * 1) >= 0 ? '+' : ''}{(((simulationResult.profit?.profit_change_percent ?? 0) * 1) || 0).toFixed(1)}%
                </p>
                <p className="text-sm text-slate-400">
                  ${((simulationResult.profit?.total_profit_change ?? 0) * 1).toLocaleString()}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-sm text-slate-400 uppercase tracking-wider mb-2">Recommendation</p>
                <p className="text-lg font-bold text-violet-400 mb-1">
                  {simulationResult.recommendation?.action || 'N/A'}
                </p>
                <p className="text-sm text-slate-400">
                  {simulationResult.recommendation?.risk_level || 'N/A'} risk
                </p>
              </div>
            </div>
          </div>
        )}

        {!elasticity && (
          <div className="text-center py-8 text-slate-400">
            <p>Calculate elasticity first to run simulations</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductDetailWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <ProductDetail />
    </ErrorBoundary>
  );
}
