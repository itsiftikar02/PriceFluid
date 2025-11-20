import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { getProducts, getCategories } from '../services/api';
import { Search, ChevronRight, TrendingUp, TrendingDown, Zap } from 'lucide-react';

function Products() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const { data: productsData, isLoading } = useQuery(
    ['products', { search, category, page }],
    () => getProducts({ search, category, page, per_page: 20 }).then(res => res.data)
  );

  const { data: categoriesData } = useQuery(
    'categories',
    () => getCategories().then(res => res.data)
  );

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];
  const totalPages = productsData?.pages || 1;

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Products Catalog</h1>
        <p className="text-slate-400 text-lg">Manage and optimize product pricing strategies</p>
      </div>

      {/* Search and Filter Section */}
      <div className="card">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-300 mb-3">Search Products</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search by product name..."
                  className="input pl-12 w-full"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Category</label>
              <select
                value={category}
                onChange={handleCategoryChange}
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
          </div>

          {/* Active Filters Display */}
          {(search || category) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
              <span className="text-sm text-slate-400">Active filters:</span>
              {search && (
                <span className="badge">
                  Search: {search}
                </span>
              )}
              {category && (
                <span className="badge badge-info">
                  {category}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-violet-500/10 mb-4">
            <Zap className="h-8 w-8 animate-pulse text-violet-400" />
          </div>
          <p className="text-slate-400 text-lg">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="card text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-4">
            <Search className="h-8 w-8 text-amber-400" />
          </div>
          <p className="text-slate-300 text-lg mb-2">No products found</p>
          <p className="text-slate-500">Try adjusting your search filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group relative"
              >
                <div className="card h-full flex flex-col hover:border-violet-500/50">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-white/5">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-white group-hover:text-violet-400 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">{product.sku}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-600 group-hover:text-violet-400 transition-all group-hover:translate-x-1 flex-shrink-0 ml-2" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-3 mb-4">
                    {/* Category and Brand */}
                    <div className="flex gap-2">
                      <span className="badge badge-info text-xs">{product.category}</span>
                      <span className="badge text-xs">{product.brand}</span>
                    </div>

                    {/* Price Section */}
                    <div className="bg-gradient-to-r from-violet-600/20 to-blue-600/20 border border-violet-500/30 rounded-lg p-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wider">Current Price</p>
                      <p className="text-2xl font-bold text-violet-300 mt-1">
                        ${product.current_price}
                      </p>
                    </div>

                    {/* Margin */}
                    <div className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3">
                      <span className="text-sm text-slate-400">Profit Margin</span>
                      <div className="flex items-center gap-1">
                        {product.margin >= 30 ? (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-amber-400" />
                        )}
                        <span className={`font-bold ${product.margin >= 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {product.margin}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer CTA */}
                  <div className="pt-4 border-t border-white/5 text-sm font-medium text-violet-400 flex items-center gap-2 group-hover:gap-3 transition-all">
                    View Details
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center items-center gap-3 pt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all ${
                      page === p
                        ? 'bg-violet-600 text-white shadow-lg'
                        : 'bg-white/10 text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {/* Results Summary */}
          <div className="text-center pt-4">
            <p className="text-slate-400 text-sm">
              Showing page {page} of {totalPages} • {products.length} products per page
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default Products;
