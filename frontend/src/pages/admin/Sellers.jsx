import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import UserAvatar from '../../components/UserAvatar';
import {
  Store, Search, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, ArrowLeft, Star, ShieldX
} from 'lucide-react';

/* ── helpers ───────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = {
    approved:  { dot: 'bg-green-400 animate-pulse', text: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30',  label: 'Approved'  },
    pending:   { dot: 'bg-yellow-400',               text: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', label: 'Pending'   },
    suspended: { dot: 'bg-red-400',                  text: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',       label: 'Suspended' },
    rejected:  { dot: 'bg-red-400',                  text: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30',       label: 'Rejected'  },
  };
  const s = cfg[status] || cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

/* ── main ──────────────────────────────────────────────── */
export default function AdminSellers() {
  const [sellers, setSellers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]           = useState(0);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { fetchSellers(); }, []);

  const fetchSellers = async (p = 1, q = '', st = statusFilter) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sellers', { params: { page: p, search: q, status: st } });
      const payload = res.data?.data ?? res.data;
      setSellers(Array.isArray(payload) ? payload : []);
      setPage(res.data.current_page || p);
      setTotalPages(res.data.last_page || 1);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (sellerId, status) => {
    try {
      await api.put(`/admin/sellers/${sellerId}`, { status });
      toast.success(`Seller ${status} successfully`);
      fetchSellers(page, search, statusFilter);
    } catch {
      toast.error('Failed to update seller status');
    }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchSellers(1, search, statusFilter); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-500/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-white">Manage Sellers</h1>
            <p className="text-sm text-gray-400">{total} registered boutiques & stores</p>
          </div>
        </div>
        <Link to="/admin/dashboard" className="flex items-center gap-2 btn-outline py-2 px-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      {/* Filters */}
      <div className="glass-card p-5 mb-5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or store…"
              className="input-field pl-9 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); fetchSellers(1, search, e.target.value); }}
            className="input-field w-44 shrink-0"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
          </select>
          <button type="submit" className="btn-primary px-6 shrink-0">Search</button>
        </form>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8 bg-navy-950/60">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Seller</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Store</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Rating</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Sales</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Registered</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-navy-800 rounded animate-pulse" style={{ width: j === 0 ? '150px' : j === 6 ? '140px' : '90px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : sellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-gray-500">
                    <Store className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No sellers found
                  </td>
                </tr>
              ) : sellers.map(s => (
                <tr key={s.id} className="hover:bg-white/[0.02] transition">
                  {/* Seller info */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                  <UserAvatar name={s.user?.name} avatarUrl={s.user?.avatar_url} size="md" rounded="xl" />
                      <div className="min-w-0">
                        <p className="font-medium text-white text-sm truncate">{s.user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{s.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  {/* Store name */}
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-200 font-medium">{s.store_name || '—'}</p>
                    {s.store_slug && <p className="text-xs text-gray-600 truncate max-w-[140px]">/{s.store_slug}</p>}
                  </td>
                  {/* Rating */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-primary-400 fill-primary-400" />
                      <span className="text-sm text-white font-medium">{s.rating ? Number(s.rating).toFixed(1) : '—'}</span>
                      {s.total_reviews > 0 && (
                        <span className="text-xs text-gray-500">({s.total_reviews})</span>
                      )}
                    </div>
                  </td>
                  {/* Sales */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-white font-medium">{s.total_sales ?? 0}</span>
                    <span className="text-xs text-gray-500 ml-1">orders</span>
                  </td>
                  {/* Status badge */}
                  <td className="px-5 py-4">
                    <StatusBadge status={s.status} />
                  </td>
                  {/* Registered date */}
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {new Date(s.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      {s.status !== 'approved' && (
                        <button
                          onClick={() => updateStatus(s.id, 'approved')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-500/40 text-green-400 hover:bg-green-500/10 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                      )}
                      {s.status !== 'suspended' && (
                        <button
                          onClick={() => updateStatus(s.id, 'suspended')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-orange-500/40 text-orange-400 hover:bg-orange-500/10 transition"
                        >
                          <ShieldX className="w-3.5 h-3.5" /> Suspend
                        </button>
                      )}
                      {s.status !== 'rejected' && (
                        <button
                          onClick={() => updateStatus(s.id, 'rejected')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/8 bg-navy-950/30">
            <p className="text-sm text-gray-400">
              Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchSellers(Math.max(1, page - 1), search)}
                disabled={page <= 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => fetchSellers(Math.min(totalPages, page + 1), search)}
                disabled={page >= totalPages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/20 border border-primary-500/40 text-sm text-primary-300 hover:bg-primary-500/30 disabled:opacity-40 transition"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
