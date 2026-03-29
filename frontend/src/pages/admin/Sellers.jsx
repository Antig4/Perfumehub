import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async (p = 1, q = '') => {
    setLoading(true);
    try {
      const res = await api.get('/admin/sellers', { params: { page: p, search: q } });
      const payload = res.data && res.data.data ? res.data.data : res.data;
      setSellers(payload || []);
      setPage(res.data.current_page || p);
      setTotalPages(res.data.last_page || 1);
    } catch (e) {
      toast.error('Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  const updateSellerStatus = async (sellerProfileId, action) => {
    try {
      await api.put(`/admin/sellers/${sellerProfileId}`, { status: action });
      toast.success('Seller updated');
      fetchSellers(page, search);
    } catch (e) {
      toast.error('Failed to update seller');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-white">Manage Sellers</h1>
        <div>
          <button onClick={() => navigate('/admin/dashboard')} className="btn-outline">Back to Dashboard</button>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sellers..." className="input-field w-full" />
          <button onClick={() => fetchSellers(1, search)} className="btn-primary">Search</button>
        </div>

        {loading ? <div className="text-gray-400">Loading sellers...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Store</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map(s => (
                  <tr key={s.id} className="border-t border-white/5">
                    <td className="py-3">{s.user?.name}</td>
                    <td className="py-3 text-sm text-gray-300">{s.store_name || 'Not setup'}</td>
                    <td className="py-3 text-sm">{s.status}</td>
                    <td className="py-3">
                      {s.status !== 'approved' && (
                        <button onClick={() => updateSellerStatus(s.id, 'approved')} className="btn-primary mr-2">Approve</button>
                      )}
                      {s.status !== 'rejected' && (
                        <button onClick={() => updateSellerStatus(s.id, 'rejected')} className="btn-outline">Reject</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-400">Page {page} of {totalPages}</div>
              <div className="space-x-2">
                <button onClick={() => fetchSellers(Math.max(1, page - 1), search)} className="btn-outline" disabled={page <= 1}>Prev</button>
                <button onClick={() => fetchSellers(Math.min(totalPages, page + 1), search)} className="btn-primary" disabled={page >= totalPages}>Next</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
