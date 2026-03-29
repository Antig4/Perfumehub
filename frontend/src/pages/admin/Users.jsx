import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { page: p, search: q } });
      // Laravel paginator returns data, current_page, last_page
      const payload = res.data && res.data.data ? res.data.data : res.data;
      setUsers(payload || []);
      setPage(res.data.current_page || p);
      setTotalPages(res.data.last_page || 1);
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/status`);
      toast.success('Status updated');
      fetchUsers(page, search);
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-white">Users & Sellers</h1>
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-outline">Back to Dashboard</button>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="input-field w-full" />
          <button onClick={() => fetchUsers(1, search)} className="btn-primary">Search</button>
        </div>

        {loading ? <div className="text-gray-400">Loading users...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t border-white/5">
                    <td className="py-3">{u.name}</td>
                    <td className="py-3 text-sm text-gray-300">{u.email}</td>
                    <td className="py-3 text-sm">{u.role}</td>
                    <td className="py-3 text-sm">{u.is_active ? 'Active' : 'Suspended'}</td>
                    <td className="py-3">
                      <button onClick={() => toggleActive(u.id)} className="btn-outline mr-2">{u.is_active ? 'Suspend' : 'Activate'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-400">Page {page} of {totalPages}</div>
              <div className="space-x-2">
                <button onClick={() => fetchUsers(Math.max(1, page - 1), search)} className="btn-outline" disabled={page <= 1}>Prev</button>
                <button onClick={() => fetchUsers(Math.min(totalPages, page + 1), search)} className="btn-primary" disabled={page >= totalPages}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
