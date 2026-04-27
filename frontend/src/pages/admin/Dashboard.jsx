import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Users, Store, DollarSign, Activity, CheckCircle2, TrendingUp, Package, Truck, FileText, ShoppingBag, Flag, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      const payload = res.data && res.data.data ? res.data.data : res.data;
      setStats({
        ...(payload || {}),
        monthly_sales: res.data?.monthly_sales || [],
        top_products: res.data?.top_products || [],
        top_sellers: res.data?.top_sellers || [],
        user_growth: res.data?.user_growth || [],
      });
    } catch (e) {
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return <div className="p-12 text-center text-gray-400">Loading admin overview...</div>;

  // Calculate growth
  const monthlyArr = stats.monthly_sales || [];
  const currentMonth = monthlyArr.length >= 1 ? Number(monthlyArr[monthlyArr.length - 1]?.revenue || 0) : 0;
  const prevMonth = monthlyArr.length >= 2 ? Number(monthlyArr[monthlyArr.length - 2]?.revenue || 0) : 0;
  const salesGrowth = prevMonth > 0 ? (((currentMonth - prevMonth) / prevMonth) * 100).toFixed(1) : null;

  // Max for bar chart
  const maxRevenue = Math.max(...monthlyArr.map(m => Number(m.revenue) || 0), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        <h1 className="text-3xl font-serif text-white">Platform Overview</h1>
        <Link to="/admin/reports" className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" /> Generate Reports
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium text-sm">Platform Revenue</h3>
            <div className="bg-primary-500/20 p-2 rounded-lg"><DollarSign className="w-5 h-5 text-primary-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">₱{Number(stats.total_revenue || 0).toLocaleString()}</p>
          {salesGrowth && <p className={`text-xs ${Number(salesGrowth) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{Number(salesGrowth) >= 0 ? '+' : ''}{salesGrowth}% from last month</p>}
        </div>
        
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium text-sm">Total Orders</h3>
            <div className="bg-blue-500/20 p-2 rounded-lg"><ShoppingBag className="w-5 h-5 text-blue-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.total_orders || 0}</p>
          <p className="text-xs text-yellow-400">{stats.pending_orders || 0} pending</p>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium text-sm">Active Users</h3>
            <div className="bg-green-500/20 p-2 rounded-lg"><Users className="w-5 h-5 text-green-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.total_users || 0}</p>
          <div className="flex gap-3 text-xs text-gray-400 mt-1">
            <span>{stats.total_customers || 0} buyers</span>
            <span>{stats.total_riders || 0} riders</span>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium text-sm">Sellers</h3>
            <div className="bg-yellow-500/20 p-2 rounded-lg"><Store className="w-5 h-5 text-yellow-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.total_sellers || 0}</p>
          <div className="flex gap-3 text-xs">
            <span className="text-yellow-400">{stats.pending_sellers || 0} pending</span>
            <Link to="/admin/verifications" className="text-primary-400 hover:underline">Review Permits →</Link>
          </div>
        </div>
      </div>

      {/* Revenue Chart & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Monthly Revenue Bar Chart */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" /> Monthly Revenue
          </h2>
          {monthlyArr.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {monthlyArr.slice(-6).map(m => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-16 shrink-0">{m.month}</span>
                  <div className="flex-1 bg-navy-950 rounded-full h-6 overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                      style={{ width: `${(Number(m.revenue) / maxRevenue * 100)}%` }}
                    />
                    <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs text-white font-medium">
                      ₱{Number(m.revenue).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{m.orders} ord</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-400" /> Top Products
          </h2>
          {(stats.top_products || []).length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No product data yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.top_products.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between bg-navy-950 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-primary-500 text-white' : 'bg-navy-800 text-gray-400'}`}>{i + 1}</span>
                    <div>
                      <p className="text-white font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-gray-400">₱{Number(p.price).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary-400">{p.sales_count || 0} sold</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sellers & System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Sellers */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Store className="w-5 h-5 text-yellow-400" /> Top Sellers
          </h2>
          <div className="space-y-3">
            {(stats.top_sellers || []).map(seller => (
              <div key={seller.id} className="flex justify-between items-center bg-navy-950/50 p-4 border border-white/5 rounded-lg">
                <div>
                  <p className="font-bold text-white">{seller.store_name}</p>
                  <p className="text-xs text-gray-400">{seller.user?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-primary-400 font-bold text-sm">{seller.total_sales || 0} sales</p>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${seller.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {seller.status}
                  </span>
                </div>
              </div>
            ))}
            {(!stats.top_sellers || stats.top_sellers.length === 0) && <p className="text-gray-500 text-sm">No seller data.</p>}
          </div>
          <div className="flex gap-3 mt-4 flex-wrap">
            <Link to="/admin/sellers" className="btn-outline flex-1 text-center text-sm">Manage Sellers</Link>
            <Link to="/admin/users" className="flex-1 text-center text-sm px-4 py-2 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-medium transition flex items-center justify-center gap-2">
              <Users className="w-4 h-4" /> Manage All Users
            </Link>
            <Link to="/admin/review-reports" className="flex-1 text-center text-sm px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium transition flex items-center justify-center gap-2">
              <Flag className="w-4 h-4" /> Reports
            </Link>
          </div>
        </div>

        {/* System Health */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" /> System Health & Stats
          </h2>
          <ul className="space-y-4 text-gray-300 text-sm">
            <li className="flex justify-between border-b border-white/5 pb-3"><span>Platform Status</span> <span className="text-green-400 font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Operational</span></li>
            <li className="flex justify-between border-b border-white/5 pb-3"><span>Total Customers</span> <span className="text-white font-medium">{stats.total_customers || 0}</span></li>
            <li className="flex justify-between border-b border-white/5 pb-3"><span>Total Riders</span> <span className="text-white font-medium">{stats.total_riders || 0}</span></li>
            <li className="flex justify-between border-b border-white/5 pb-3"><span>Registered Brands</span> <span className="text-white font-medium">{stats.total_brands || 0}</span></li>
            <li className="flex justify-between border-b border-white/5 pb-3"><span>Total Categories</span> <span className="text-white font-medium">{stats.total_categories || 0}</span></li>
            <li className="flex justify-between pb-3"><span>Payment Mode</span> <span className="text-green-400 font-medium bg-green-400/10 px-2 py-0.5 rounded">COD + Online</span></li>
          </ul>

          {/* User Growth Mini Chart */}
          {(stats.user_growth || []).length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/5">
              <h3 className="text-xs text-gray-400 mb-3">User Growth (last 6 months)</h3>
              <div className="flex items-end gap-2 h-16">
                {stats.user_growth.map(g => {
                  const maxG = Math.max(...stats.user_growth.map(x => x.count), 1);
                  return (
                    <div key={g.month} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-primary-500/30 rounded-t" style={{ height: `${(g.count / maxG) * 100}%`, minHeight: '4px' }} />
                      <span className="text-[10px] text-gray-500">{g.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
