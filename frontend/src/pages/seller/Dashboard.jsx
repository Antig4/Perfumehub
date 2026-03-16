import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Package, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/seller/dashboard');
        setStats(data);
      } catch (e) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading || !stats) return <div className="p-12 text-center text-gray-400">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-white">Seller Dashboard</h1>
        <Link to="/seller/products/new" className="btn-primary">Add New Product</Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Total Revenue</h3>
            <div className="bg-primary-500/20 p-2 rounded-lg"><DollarSign className="w-6 h-6 text-primary-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">₱{Number(stats.total_revenue).toLocaleString()}</p>
        </div>
        
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Active Products</h3>
            <div className="bg-blue-500/20 p-2 rounded-lg"><Package className="w-6 h-6 text-blue-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total_products}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Total Orders</h3>
            <div className="bg-green-500/20 p-2 rounded-lg"><ShoppingBag className="w-6 h-6 text-green-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total_orders}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Items Sold</h3>
            <div className="bg-yellow-500/20 p-2 rounded-lg"><TrendingUp className="w-6 h-6 text-yellow-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total_items_sold}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif text-white">Top Performing Products</h2>
            <Link to="/seller/products" className="text-primary-400 hover:text-white text-sm">View All</Link>
          </div>
          <div className="space-y-4">
            {stats.top_products.map((product, i) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-navy-950/50 rounded-lg border border-white/5">
                <div className="flex items-center gap-4">
                  <span className="text-gray-500 font-bold w-4">{i + 1}</span>
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-sm text-gray-400">{product.sales_count} sold</p>
                  </div>
                </div>
                <p className="text-primary-400 font-bold">₱{Number(product.price).toLocaleString()}</p>
              </div>
            ))}
            {stats.top_products.length === 0 && <p className="text-gray-500 text-center py-4">No sales data yet.</p>}
          </div>
        </div>

        {/* Recent Orders Overview */}
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif text-white">Recent Orders</h2>
            <Link to="/seller/orders" className="text-primary-400 hover:text-white text-sm">View All</Link>
          </div>
          <div className="space-y-4">
             {/* Note: stats.recent_orders would be added to the backend endpoint if it doesn't exist, utilizing order history component logic if needed */}
             <p className="text-gray-500 text-center py-4">Head over to the orders page to manage fulfilling new orders.</p>
             <Link to="/seller/orders" className="w-full btn-outline block text-center">Manage Orders</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
