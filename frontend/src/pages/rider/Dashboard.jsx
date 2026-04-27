import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Truck, MapPin, Package, CheckCircle2, ToggleLeft, ToggleRight, Star, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import VerificationBanner, { VerifiedBadge } from '../../components/VerificationBanner';

export default function RiderDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const [verification, setVerification] = useState(null);
  const [verifyLoading, setVerifyLoading] = useState(true);

  useEffect(() => { 
    fetchStats(); 
    fetchVerification();
  }, []);

  const fetchVerification = async () => {
    setVerifyLoading(true);
    try {
      const { data } = await api.get('/verification/rider-status');
      setVerification(data.data);
    } catch { /* ignore */ } finally {
      setVerifyLoading(false);
    }
  };

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

  const toggleAvailability = async () => {
    setToggling(true);
    try {
      const res = await api.post('/rider/toggle-availability');
      toast.success(res.data.message);
      // Update locally without full refetch
      setStats(prev => ({ ...prev, is_available: res.data.is_available }));
    } catch (e) {
      toast.error('Failed to update availability');
    } finally {
      setToggling(false);
    }
  };

  if (loading || !stats) return <div className="p-12 text-center text-gray-400">Loading dashboard...</div>;

  const isVerified  = verification?.verification_status === 'verified';
  const vStatus     = verification?.verification_status || 'unverified';
  const isBlocked   = !isVerified;

  const isAvailable = stats.is_available;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-serif text-white">Rider Dashboard</h1>
          {isVerified && <VerifiedBadge kind="rider" size="md" />}
        </div>

        {/* Availability Toggle */}
        <button
          onClick={toggleAvailability}
          disabled={toggling || isBlocked}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
            isAvailable
              ? 'border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500/20'
              : 'border-red-500 bg-red-500/10 text-red-400 hover:bg-red-500/20'
          } ${isBlocked ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {isAvailable
            ? <><ToggleRight className="w-6 h-6" /> Available for Delivery</>
            : <><ToggleLeft className="w-6 h-6" /> {toggling ? 'Updating...' : 'Set as Busy / Offline'}</>
          }
        </button>
      </div>

      {!verifyLoading && (
        <VerificationBanner
          status={vStatus}
          kind="rider"
          docUrl={verification?.license_document_url}
          reason={verification?.verification_rejection_reason}
          onUploaded={fetchVerification}
        />
      )}

      {isBlocked ? (
        <div className="glass-card p-10 text-center border border-yellow-500/20 mb-8">
          <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-primary-400 opacity-60" />
          <h2 className="text-xl font-serif text-white mb-2">Account Verification Required</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Your rider account needs to be verified before you can manage deliveries.
            Please upload your <strong className="text-white">Driving License</strong> above to start the verification process.
          </p>
          <p className="text-xs text-gray-600 mt-3">Verification typically takes 1–2 business days.</p>
        </div>
      ) : (
        <>

      {/* Status banner */}
      <div className={`mb-8 p-4 rounded-xl border text-sm font-medium flex items-center gap-3 ${
        isAvailable
          ? 'border-green-500/30 bg-green-500/10 text-green-300'
          : 'border-orange-500/30 bg-orange-500/10 text-orange-300'
      }`}>
        <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-green-400 animate-pulse' : 'bg-orange-400'}`} />
        {isAvailable
          ? 'You are currently AVAILABLE — sellers can assign new deliveries to you.'
          : 'You are currently BUSY/OFFLINE — sellers will not assign new orders until you toggle back.'}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Pending Deliveries</h3>
            <div className="bg-yellow-500/20 p-2 rounded-lg"><Package className="w-6 h-6 text-yellow-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pending_deliveries ?? 0}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">In Transit</h3>
            <div className="bg-blue-500/20 p-2 rounded-lg"><Truck className="w-6 h-6 text-blue-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.in_transit ?? 0}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Completed Today</h3>
            <div className="bg-green-500/20 p-2 rounded-lg"><CheckCircle2 className="w-6 h-6 text-green-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.completed_today ?? 0}</p>
        </div>

        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 font-medium">Rating</h3>
            <div className="bg-primary-500/20 p-2 rounded-lg"><Star className="w-6 h-6 text-primary-400" /></div>
          </div>
          <p className="text-3xl font-bold text-white">{stats.rating ? Number(stats.rating).toFixed(1) : '—'}</p>
          <Link to="/rider/deliveries" className="mt-4 btn-primary w-full text-center text-sm py-2">View My Routes</Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
          <h2 className="text-xl font-serif text-white">Recent Activity</h2>
          <Link to="/rider/deliveries" className="text-primary-400 hover:text-white text-sm transition">View all →</Link>
        </div>
        <div className="space-y-4">
          {(stats.recent_activity || []).map(delivery => (
            <div key={delivery.id} className="flex gap-4 p-4 bg-navy-950/50 rounded-lg border border-white/5">
              <div className="w-10 h-10 rounded-full bg-navy-900 flex items-center justify-center shrink-0">
                {delivery.status === 'delivered' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <MapPin className="w-5 h-5 text-gray-400" />}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white">Order #{delivery.order?.order_number}</p>
                <p className="text-sm text-gray-400">Customer: {delivery.order?.user?.name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${
                    delivery.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                    delivery.status === 'out_for_delivery' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {delivery.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-500">{new Date(delivery.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
          {(stats.recent_activity || []).length === 0 && (
            <p className="text-center text-gray-500 py-8">No recent delivery activity.</p>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
