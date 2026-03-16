import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Users, Store, DollarSign, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
    } catch (e) {
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return <div className="p-12 text-center text-gray-400">Loading admin overview...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
        <h1 className="text-3xl font-serif text-white">Platform Overview</h1>
        <div className="flex gap-4">
           {/* Placeholders for settings/reports links */}
           <Link to="/admin/reports" className="btn-outline hidden sm:flex">Generate Reports</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium">Platform Revenue</h3>
            <div className="bg-primary-500/20 p-2 rounded-lg"><DollarSign className="w-6 h-6 text-primary-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">₱{Number(stats.total_revenue).toLocaleString()}</p>
          {stats.sales_growth && <p className="text-xs text-green-400">+{stats.sales_growth}% from last month</p>}
        </div>
        
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium">Total Orders</h3>
            <div className="bg-blue-500/20 p-2 rounded-lg"><Activity className="w-6 h-6 text-blue-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.total_orders}</p>
          {stats.order_growth && <p className="text-xs text-green-400">+{stats.order_growth}% from last month</p>}
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium">Active Users</h3>
            <div className="bg-green-500/20 p-2 rounded-lg"><Users className="w-6 h-6 text-green-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.total_users}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between border-primary-500/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 font-medium">Registered Sellers</h3>
            <div className="bg-yellow-500/20 p-2 rounded-lg"><Store className="w-6 h-6 text-yellow-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white mb-1">{stats.total_sellers}</p>
          <Link to="/admin/users" className="text-xs text-primary-400 font-medium hover:underline">Manage Sellers &rarr;</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Sellers */}
        <div className="glass-card p-6">
           <h2 className="text-xl font-serif text-white mb-6">Recent Seller Applications</h2>
           <div className="space-y-4">
             {stats.recent_sellers?.map(seller => (
               <div key={seller.id} className="flex justify-between items-center bg-navy-950/50 p-4 border border-white/5 rounded-lg">
                 <div>
                   <p className="font-bold text-white">{seller.user?.name}</p>
                   <p className="text-xs text-gray-400">Store: {seller.store_name || "Not setup"}</p>
                 </div>
                 <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${seller.status === 'approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                   {seller.status}
                 </span>
               </div>
             ))}
             {(!stats.recent_sellers || stats.recent_sellers.length === 0) && <p className="text-gray-500 text-sm">No recent seller activity.</p>}
           </div>
           <Link to="/admin/users" className="btn-outline w-full mt-6 text-sm">View All Users</Link>
        </div>

        {/* System Activity/Status */}
        <div className="glass-card p-6">
           <h2 className="text-xl font-serif text-white mb-6">System Health & Stats</h2>
           <ul className="space-y-5 text-gray-300 text-sm">
             <li className="flex justify-between border-b border-white/5 pb-3"><span>Platform Status</span> <span className="text-green-400 font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Operational</span></li>
             <li className="flex justify-between border-b border-white/5 pb-3"><span>Registered Brands</span> <span className="text-white font-medium">{stats.total_brands || 0}</span></li>
             <li className="flex justify-between border-b border-white/5 pb-3"><span>Total Categories</span> <span className="text-white font-medium">{stats.total_categories || 0}</span></li>
             <li className="flex justify-between pb-3"><span>PayMongo Mode</span> <span className="text-yellow-400 font-medium bg-yellow-400/10 px-2 py-0.5 rounded">TEST</span></li>
           </ul>
        </div>
      </div>
    </div>
  );
}
