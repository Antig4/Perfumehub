import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Truck, MapPin, Package, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RiderDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
  const res = await api.get('/rider/dashboard');
  const payload = res.data && res.data.data ? res.data.data : res.data;
  setStats(payload || {});
    } catch (e) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) return <div className="p-12 text-center text-gray-400">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-serif text-white mb-8">Rider Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Pending Deliveries</h3>
            <div className="bg-yellow-500/20 p-2 rounded-lg"><Package className="w-6 h-6 text-yellow-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pending_deliveries}</p>
        </div>
        
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">In Transit</h3>
            <div className="bg-blue-500/20 p-2 rounded-lg"><Truck className="w-6 h-6 text-blue-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.in_transit}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Completed Today</h3>
            <div className="bg-green-500/20 p-2 rounded-lg"><CheckCircle2 className="w-6 h-6 text-green-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completed_today}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between text-center justify-center border border-primary-500/30">
          <h3 className="text-primary-400 font-medium mb-2">My Deliveries</h3>
          <p className="text-gray-400 text-sm mb-4">Manage your assigned routes and statuses</p>
          <a href="/rider/deliveries" className="btn-primary w-full shadow-lg shadow-primary-500/20">View Route</a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <h2 className="text-xl font-serif text-white">Recent Activity Tracker</h2>
        </div>
        <div className="space-y-6">
          {(stats.recent_activity || []).map(delivery => (
            <div key={delivery.id} className="flex gap-4 p-4 bg-navy-950/50 rounded-lg">
              <div className="flex flex-col items-center">
                 <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center shrink-0">
                   {delivery.status === 'delivered' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <MapPin className="w-5 h-5 text-gray-400" />}
                 </div>
                 <div className="w-0.5 h-full bg-white/5 mt-2 hidden sm:block"></div>
              </div>
              <div className="flex-1 pb-2">
                <p className="font-bold text-white">Order #{delivery.order?.order_number}</p>
                <p className="text-sm text-gray-400 mb-2">Customer: {delivery.order?.user?.name}</p>
                
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${delivery.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {delivery.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(delivery.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
          {(stats.recent_activity || []).length === 0 && <p className="text-center text-gray-500 py-8">No recent delivery activity.</p>}
        </div>
      </div>
    </div>
  );
}
