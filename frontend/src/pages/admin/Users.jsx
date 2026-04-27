import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import UserAvatar from '../../components/UserAvatar';
import {
  Users, Search, ChevronLeft, ChevronRight,
  ShieldCheck, ShieldX, ArrowLeft, UserCog
} from 'lucide-react';

/* ── helpers ───────────────────────────────────────────── */
const ROLE_STYLES = {
  admin:    'bg-purple-500/15 text-purple-300 border-purple-500/30',
  seller:   'bg-primary-500/15 text-primary-300 border-primary-500/30',
  customer: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  rider:    'bg-green-500/15 text-green-300 border-green-500/30',
};

function StatusBadge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Suspended
    </span>
  );
}



/* ── main ──────────────────────────────────────────────── */
export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal]       = useState(0);
  const [search, setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async (p = 1, q = '', role = roleFilter) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { page: p, search: q, role } });
      const payload = res.data?.data ?? res.data;
      setUsers(Array.isArray(payload) ? payload : []);
      setPage(res.data.current_page || p);
      setTotalPages(res.data.last_page || 1);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/status`);
      toast.success('User status updated');
      fetchUsers(page, search, roleFilter);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleSearch = (e) => { e.preventDefault(); fetchUsers(1, search, roleFilter); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-serif text-white">All Users</h1>
            <p className="text-sm text-gray-400">{total} registered accounts</p>
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
              placeholder="Search by name or email…"
              className="input-field pl-9 w-full"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); fetchUsers(1, search, e.target.value); }}
            className="input-field w-40 shrink-0"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="seller">Seller</option>
            <option value="customer">Customer</option>
            <option value="rider">Rider</option>
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
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">User</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Email</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Role</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Joined</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-navy-800 rounded animate-pulse" style={{ width: j === 0 ? '140px' : j === 5 ? '80px' : '100px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-gray-500">
                    <UserCog className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No users found
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition">
                  {/* User */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                  <UserAvatar name={u.name} avatarUrl={u.avatar_url} size="md" />
                      <span className="font-medium text-white text-sm">{u.name}</span>
                    </div>
                  </td>
                  {/* Email */}
                  <td className="px-5 py-4 text-sm text-gray-400">{u.email}</td>
                  {/* Role */}
                  <td className="px-5 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${ROLE_STYLES[u.role] || 'bg-gray-500/15 text-gray-300 border-gray-500/30'}`}>
                      {u.role}
                    </span>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge active={u.is_active} />
                  </td>
                  {/* Joined */}
                  <td className="px-5 py-4 text-sm text-gray-500">
                    {new Date(u.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  {/* Action */}
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => toggleActive(u.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                        u.is_active
                          ? 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                          : 'border-green-500/40 text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      {u.is_active ? <><ShieldX className="w-3.5 h-3.5" /> Suspend</> : <><ShieldCheck className="w-3.5 h-3.5" /> Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-white/8 bg-navy-950/30">
            <p className="text-sm text-gray-400">Page <span className="text-white font-medium">{page}</span> of <span className="text-white font-medium">{totalPages}</span></p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchUsers(Math.max(1, page - 1), search)}
                disabled={page <= 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => fetchUsers(Math.min(totalPages, page + 1), search)}
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
