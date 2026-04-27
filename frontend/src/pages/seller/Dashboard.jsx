import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Package, TrendingUp, ShoppingBag, DollarSign, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import VerificationBanner, { VerifiedBadge } from '../../components/VerificationBanner';

export default function SellerDashboard() {
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [verification, setVerification] = useState(null); // { verification_status, ... }
  const [verifyLoading, setVerifyLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchVerification();
  }, []);

  const fetchVerification = async () => {
    setVerifyLoading(true);
    try {
      const { data } = await api.get('/verification/seller-status');
      setVerification(data.data);
    } catch { /* ignore */ } finally {
      setVerifyLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/seller/dashboard');
      const payload = res.data?.data ?? res.data ?? {};
      const rawStats     = payload.stats || {};
      const topProducts  = Array.isArray(payload.top_products)  ? payload.top_products  : [];
      const monthlySales = Array.isArray(payload.monthly_sales) ? payload.monthly_sales : [];
      const recentOrders = Array.isArray(payload.recent_orders) ? payload.recent_orders : [];

      setStats({
        total_revenue:    Number(rawStats.total_revenue || 0),
        total_products:   rawStats.total_products   || 0,
        total_orders:     rawStats.total_orders     || 0,
        low_stock_count:  rawStats.low_stock_count  || 0,
        total_items_sold: rawStats.total_items_sold ?? topProducts.reduce((s, p) => s + (Number(p.sales_count) || 0), 0),
        top_products:     topProducts,
        monthly_sales:    monthlySales,
        recent_orders:    recentOrders,
      });
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const isVerified  = verification?.verification_status === 'verified';
  const vStatus     = verification?.verification_status || 'unverified';
  const isBlocked   = !isVerified; // unverified or pending or rejected → block features

  if (loading || !stats) return <div className="p-12 text-center text-gray-400">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-serif text-white">Seller Dashboard</h1>
          {isVerified && <VerifiedBadge kind="seller" size="md" />}
        </div>
        {isVerified ? (
          <Link to="/seller/products/new" className="btn-primary">Add New Product</Link>
        ) : (
          <button disabled className="btn-primary opacity-40 cursor-not-allowed" title="Verify your account first">Add New Product</button>
        )}
      </div>

      {/* ── Verification Banner ──────────────────────────────── */}
      {!verifyLoading && (
        <VerificationBanner
          status={vStatus}
          kind="seller"
          docUrl={verification?.verification_document_url}
          reason={verification?.verification_rejection_reason}
          onUploaded={fetchVerification}
        />
      )}

      {/* ── Blocked overlay when not verified ─────────────────── */}
      {isBlocked ? (
        <div className="glass-card p-10 text-center border border-yellow-500/20">
          <ShieldCheck className="w-14 h-14 mx-auto mb-4 text-primary-400 opacity-60" />
          <h2 className="text-xl font-serif text-white mb-2">Account Verification Required</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Your seller account needs to be verified before you can add products, manage orders, or assign delivery riders.
            Please upload your <strong className="text-white">Business Permit</strong> above to start the verification process.
          </p>
          <p className="text-xs text-gray-600 mt-3">Verification typically takes 1–2 business days.</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="glass-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">Total Revenue</h3>
                <div className="bg-primary-500/20 p-2 rounded-lg"><DollarSign className="w-6 h-6 text-primary-400" /></div>
              </div>
              <p className="text-3xl font-bold text-white">₱{Number(stats.total_revenue || 0).toLocaleString()}</p>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">Active Products</h3>
                <div className="bg-blue-500/20 p-2 rounded-lg"><Package className="w-6 h-6 text-blue-400" /></div>
              </div>
              <p className="text-3xl font-bold text-white">{stats.total_products || 0}</p>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">Total Orders</h3>
                <div className="bg-green-500/20 p-2 rounded-lg"><ShoppingBag className="w-6 h-6 text-green-400" /></div>
              </div>
              <p className="text-3xl font-bold text-white">{stats.total_orders || 0}</p>
            </div>

            <div className="glass-card p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 font-medium">Items Sold</h3>
                <div className="bg-yellow-500/20 p-2 rounded-lg"><TrendingUp className="w-6 h-6 text-yellow-400" /></div>
              </div>
              <p className="text-3xl font-bold text-white">{stats.total_items_sold ?? 0}</p>
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
                {(stats.top_products || []).map((product, i) => (
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
                {(stats.top_products || []).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No sales data yet.</p>
                )}
              </div>
            </div>

            {/* Orders + Riders */}
            <div className="glass-card p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-white">Recent Orders</h2>
                <Link to="/seller/orders" className="text-primary-400 hover:text-white text-sm">View All</Link>
              </div>
              <div className="space-y-4 flex-1">
                <p className="text-gray-500 text-center py-4">Head over to the orders page to manage fulfilling new orders.</p>
                <Link to="/seller/orders" className="w-full btn-outline block text-center">Manage Orders</Link>
              </div>
              <div className="mt-8 pt-8 border-t border-white/10">
                <h2 className="text-xl font-serif text-white mb-4">Delivery Team</h2>
                <p className="text-sm text-gray-400 mb-4">Assign up to 3 delivery riders to handle your store's fulfillments automatically.</p>
                <Link to="/seller/riders" className="w-full btn-primary py-2 px-4 flex items-center justify-center gap-2">
                  Manage Delivery Riders
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
