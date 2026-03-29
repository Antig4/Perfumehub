import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Package, Search, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newCount, setNewCount] = useState(0);
  const lastIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    fetchOrders();

    // Real-time EventSource + polling fallback
    let es;
    const token = localStorage.getItem('token') || '';
    const streamUrl = `/api/seller/orders/stream${token ? '?token=' + token : ''}`;

    if (window.EventSource) {
      try {
        es = new EventSource(streamUrl);
        es.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            const incoming = payload.data || [];
            // merge incoming changes into existing orders map (update/insert)
            setOrders((prev) => {
              const map = new Map(prev.map(o => [o.id, o]));
              let added = 0;
              for (const o of incoming) {
                if (!map.has(o.id)) added++;
                map.set(o.id, o);
              }
              const merged = Array.from(map.values()).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
              // keep only the latest 50 orders to avoid unbounded growth
              const capped = merged.slice(0, 50);
              // notify about newly arrived orders after initial load
              if (added > 0 && !isInitialLoadRef.current) {
                setNewCount(c => c + added);
                import('react-hot-toast').then(({ default: toast }) => toast.success(`+${added} new order(s)`));
              }
              lastIdsRef.current = new Set(capped.map(o => o.id));
              return capped;
            });
          } catch (err) {
            // ignore parse errors
          }
        };
        es.onerror = () => {
          if (es) es.close();
          es = null;
        };
      } catch (err) {
        // ignore; fallback to polling
      }
    }

    const pollInterval = setInterval(() => {
      if (!es) fetchOrders();
    }, 10000);

    return () => {
      if (es) es.close();
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const { data } = await api.get('/seller/orders', { params });
  // cap to latest 50 for initial load as well
  const list = (data.data || []).sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,50);
  setOrders(list); // Sanctum pagination
  // Update last-seen IDs so SSE doesn't count these as new
  lastIdsRef.current = new Set(list.map(o => o.id));
      isInitialLoadRef.current = false;
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchOrders(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm]);

  const updateStatus = async (orderId, status) => {
    // Optimistic UI: update the single order row locally to avoid blocking
    const prev = orders.find(o => o.id === orderId);
    const prevStatus = prev ? prev.status : null;
    setUpdating((u) => ({ ...u, [orderId]: true }));
    setOrders((prevList) => prevList.map(o => o.id === orderId ? { ...o, status } : o));

    try {
      // Use seller namespace for updating order status
      await api.put(`/seller/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      // keep local optimistic state; no full reload to keep it snappy
    } catch (e) {
      // revert optimistic change on failure and fetch fresh data to sync
      toast.error('Failed to update status');
      setOrders((prevList) => prevList.map(o => o.id === orderId ? { ...o, status: prevStatus } : o));
      try { await fetchOrders(); } catch (_) { /* ignore secondary errors */ }
    } finally {
      setUpdating((u) => ({ ...u, [orderId]: false }));
    }
  };

  const clearNewBadge = () => setNewCount(0);

  const quickAction = (order) => {
    // map current status to next logical action
    switch (order.status) {
      case 'pending': return () => updateStatus(order.id, 'confirmed');
      case 'confirmed': return () => updateStatus(order.id, 'packed');
      case 'packed': return () => updateStatus(order.id, 'out_for_delivery');
      case 'out_for_delivery': return () => updateStatus(order.id, 'delivered');
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white">Manage Orders</h1>
          <p className="text-gray-400">Process and fulfill customer orders</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2">
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="packed">Packed</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="relative flex-1 md:flex-none">
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search orders or customer" className="input-field pl-10" />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
          </div>
          <button onClick={clearNewBadge} className="ml-2 inline-flex items-center gap-2 bg-primary-500/10 text-primary-300 px-3 py-2 rounded">
            New <span className="bg-primary-400 text-navy-900 px-2 py-0.5 rounded text-sm">{newCount}</span>
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 bg-navy-950/50">
           <div className="relative max-w-md">
             <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
             <input type="text" placeholder="Search by Order ID or Customer" className="input-field pl-10" />
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-900/50 text-gray-400 text-sm font-medium border-b border-white/5 uppercase tracking-wider">
                <th className="p-4">Order Details</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    No orders to fulfill right now.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5 transition">
                    <td className="p-4">
                      <p className="font-bold text-white mb-1">{order.order_number}</p>
                      <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</p>
                      <div className="mt-2 text-sm text-gray-300">
                        {order.items?.map(item => (
                          <p key={item.id} className="truncate max-w-[200px]">- {item.quantity}x {item.product?.name}</p>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-white">{order.user?.name}</p>
                      <p className="text-sm text-gray-400">{(order.delivery?.recipient_phone || order.contact_phone || order.user?.phone) || 'No phone'}</p>
                    </td>
                    <td className="p-4 text-white font-medium">₱{Number(order.total).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {order.status === 'delivered' ? (
                          <span className="text-sm font-semibold px-3 py-1 rounded bg-green-500/10 text-green-400">Delivered</span>
                        ) : (
                          <>
                            <select 
                              className="input-field py-1 px-2 text-sm max-w-[150px]"
                              value={order.status}
                              onChange={(e) => updateStatus(order.id, e.target.value)}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="packed">Packed</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                            {quickAction(order) && (
                              <button onClick={quickAction(order)} className="btn-primary py-1 px-3 text-sm">
                                {updating[order.id] ? <LoadingSpinner size={0.9} /> : 'Quick'}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <Link to={`/seller/orders/${order.id}`} className="inline-flex p-2 text-primary-400 hover:text-white transition bg-primary-500/10 rounded-md">
                           <ExternalLink className="w-4 h-4" />
                         </Link>
                         <button onClick={() => updateStatus(order.id, 'cancelled')} className="inline-flex p-2 text-red-400 hover:text-white transition bg-red-500/10 rounded-md">
                           {updating[order.id] ? <LoadingSpinner size={0.9} /> : 'Cancel'}
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
