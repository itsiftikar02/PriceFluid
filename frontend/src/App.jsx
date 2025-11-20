import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  Calculator, 
  ShoppingCart, 
  Settings,
  FileSpreadsheet,
  Menu,
  X,
  Sparkles,
  Zap,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from 'lucide-react';
import { useDarkMode } from './context/DarkModeContext';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Elasticity from './pages/Elasticity';
import Scenarios from './pages/Scenarios';
import Recommendations from './pages/Recommendations';

function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/products', label: 'Products', icon: ShoppingCart },
    { path: '/elasticity', label: 'Elasticity', icon: TrendingUp },
    { path: '/scenarios', label: 'Scenarios', icon: Calculator },
    { path: '/recommendations', label: 'Recommendations', icon: Sparkles },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 backdrop-blur-xl border-r border-white/10 dark:border-slate-700/50 bg-slate-950/80 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-white/10">
          {sidebarOpen && (
            <div className="flex items-center group">
              <div className="relative">
                <DollarSign className="h-8 w-8 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
                <div className="absolute inset-0 blur-xl bg-emerald-500/20 group-hover:bg-emerald-600/30 transition-all -z-10"></div>
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                PriceFluid
              </span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="relative">
              <DollarSign className="h-8 w-8 text-emerald-500 group-hover:text-emerald-400 transition-colors mx-auto" />
              <div className="absolute inset-0 blur-xl bg-emerald-500/20 group-hover:bg-emerald-600/30 transition-all -z-10"></div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                  active
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {active && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg opacity-100 shadow-lg shadow-violet-500/50"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg opacity-0 group-hover:opacity-30 blur-lg transition-opacity"></div>
                  </>
                )}
                <Icon className={`h-5 w-5 flex-shrink-0 relative z-10 transition-transform ${!active && 'group-hover:scale-110'}`} />
                {sidebarOpen && (
                  <span className="relative z-10 font-medium">{item.label}</span>
                )}
                {!active && (
                  <div className="absolute inset-0 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/10 p-3 space-y-2">
          {/* Dark mode toggle removed as per your comment */}
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 backdrop-blur-2xl border-b border-white/10 dark:border-slate-700/50 bg-slate-950/80">
        <div className="h-full px-4 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          
          <div className="flex items-center group">
            <div className="relative">
              <DollarSign className="h-7 w-7 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
              <div className="absolute inset-0 blur-xl bg-emerald-500/20 group-hover:bg-emerald-600/30 transition-all -z-10"></div>
            </div>
            <span className="ml-2 text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              PriceFluid
            </span>
          </div>
          
          <div className="w-10"></div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-20 backdrop-blur-xl border-b border-white/10 bg-slate-950/95">
          <nav className="px-2 pt-2 pb-3 space-y-1 max-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 ${
                    active
                      ? 'text-white bg-gradient-to-r from-violet-600 to-blue-600 shadow-lg shadow-violet-500/50'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950">
        {/* Animated background gradient */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950"></div>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <Sidebar />
        
        <main className="lg:ml-64 transition-all duration-300 pt-16 lg:pt-0 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/elasticity" element={<Elasticity />} />
              <Route path="/scenarios" element={<Scenarios />} />
              <Route path="/recommendations" element={<Recommendations />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
