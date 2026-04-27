import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Package, Search, ExternalLink, UserCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import Modal from '../../components/Modal';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [newCount, setNewCount] = useState(0);
  const lastIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // Rider assign modal
  const [assignModal, setAssignModal] = useState({ open: false, order: null });
  const [myRiders, setMyRiders] = useState([]);
  const [assigning, setAssigning] = useState(false);

  // Fetch my riders once
  useEffect(() => {
    api.get('/seller/riders').then(({ data }) => {
      setMyRiders(data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchOrders();
    // Simple polling every 15s — no SSE (route doesn't exist)
    const pollInterval = setInterval(fetchOrders, 15000);
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const { data } = await api.get('/seller/orders', { params });
      const list = (data.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 50);

      // Detect new orders after first load
      if (!isInitialLoadRef.current) {
        const newOnes = list.filter(o => !lastIdsRef.current.has(o.id));
        if (newOnes.length) {
          setNewCount(c => c + newOnes.length);
          toast.success(`+${newOnes.length} new order(s)`);
        }
      }

      setOrders(list);
      lastIdsRef.current = new Set(list.map(o => o.id));
      isInitialLoadRef.current = false;
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when filter/search changes
  useEffect(() => {
    const t = setTimeout(() => fetchOrders(), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm]);

  const updateStatus = async (orderId, status) => {
    const prev = orders.find(o => o.id === orderId);
    const prevStatus = prev ? prev.status : null;
    setUpdating(u => ({ ...u, [orderId]: true }));
    setOrders(prevList => prevList.map(o => o.id === orderId ? { ...o, status } : o));

    try {
      await api.put(`/seller/orders/${orderId}/status`, { status });
      const label = status === 'out_for_delivery' ? 'Ready to Pick-up' : status.replace(/_/g, ' ');
      toast.success(`Order marked as ${label}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update status');
      setOrders(prevList => prevList.map(o => o.id === orderId ? { ...o, status: prevStatus } : o));
      fetchOrders();
    } finally {
      setUpdating(u => ({ ...u, [orderId]: false }));
    }
  };

  const openAssignModal = (order) => {
    if (myRiders.length === 0) {
      toast.error('You have no riders in your team. Go to Manage Riders first.');
      return;
    }
    setAssignModal({ open: true, order });
  };

  const assignRider = async (riderId) => {
    if (!assignModal.order) return;
    setAssigning(true);
    try {
      await api.post(`/seller/orders/${assignModal.order.id}/assign-rider`, { rider_id: riderId });
      toast.success('Rider assigned to this order!');
      setAssignModal({ open: false, order: null });
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to assign rider');
    } finally {
      setAssigning(false);
    }
  };

  const quickAction = (order) => {
    switch (order.status) {
      case 'pending': return () => updateStatus(order.id, 'confirmed');
      case 'confirmed': return () => updateStatus(order.id, 'packed');
      case 'packed': return () => updateStatus(order.id, 'out_for_delivery');
      default: return null;
    }
  };

  const quickLabel = (status) => {
    switch (status) {
      case 'pending': return 'Confirm';
      case 'confirmed': return 'Pack';
      case 'packed': return 'Ready';
      default: return 'Quick';
    }
  };

  const clearNewBadge = () => setNewCount(0);

  return (
    <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-12 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white">Manage Orders</h1>
          <p className="text-gray-400">Process and fulfill customer orders</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field py-2">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="packed">Packed</option>
            <option value="out_for_delivery">Ready to Pick-up</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="relative flex-1 md:flex-none">
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search orders or customer" className="input-field pl-10" />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-500" />
          </div>
          {newCount > 0 && (
            <button onClick={clearNewBadge} className="inline-flex items-center gap-2 bg-primary-500/10 text-primary-300 px-3 py-2 rounded">
              New <span className="bg-primary-400 text-navy-900 px-2 py-0.5 rounded text-sm">{newCount}</span>
            </button>
          )}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
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
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">Loading orders...</td></tr>
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
                      <p className="text-sm text-gray-400">{order.delivery?.recipient_phone || order.contact_phone || order.user?.phone || 'No phone'}</p>
                      <p className="text-xs mt-1">
                        <span className={`px-2 py-0.5 rounded font-bold ${order.payment_method === 'cod' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {order.payment_method?.toUpperCase()}
                        </span>
                        <span className={`ml-1 px-2 py-0.5 rounded font-bold ${order.payment_status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {order.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
                      </p>
                    </td>
                    <td className="p-4 text-white font-medium">₱{Number(order.total).toLocaleString()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.status === 'delivered' ? (
                          <span className="text-sm font-semibold px-3 py-1 rounded bg-green-500/10 text-green-400">Delivered</span>
                        ) : (
                          <>
                            <select
                              className="input-field py-1 px-2 text-sm max-w-[150px]"
                              value={order.status}
                              disabled={!!updating[order.id]}
                              onChange={(e) => updateStatus(order.id, e.target.value)}
                            >
                              {/* Sellers can only set: pending → confirmed → packed */}
                              {/* Out for Delivery / Delivered / Cancelled are set by the rider or system */}
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="packed">Packed</option>
                              {/* Show read-only states if order is already past packed */}
                              {['out_for_delivery','delivered','cancelled'].includes(order.status) && (
                                <option value={order.status} disabled>
                                  {order.status === 'out_for_delivery' ? 'Ready to Pick-up' :
                                   order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </option>
                              )}
                            </select>
                            {quickAction(order) && (
                              <button
                                onClick={quickAction(order)}
                                disabled={!!updating[order.id]}
                                className="btn-primary py-1 px-3 text-sm min-w-[80px] flex items-center justify-center"
                              >
                                {updating[order.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : quickLabel(order.status)}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                      {/* Rider assignment info */}
                      {order.delivery && (
                        <p className="text-xs text-gray-500 mt-1">
                          {order.delivery.rider_id
                            ? <span className="text-green-400">🏍 Rider assigned</span>
                            : <span className="text-orange-400">⚠ No rider assigned</span>
                          }
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Assign rider button — only for non-delivered, non-cancelled orders */}
                        {!['delivered', 'cancelled'].includes(order.status) && (
                          <button
                            onClick={() => openAssignModal(order)}
                            className="inline-flex p-2 text-yellow-400 hover:text-white transition bg-yellow-500/10 rounded-md"
                            title="Assign Rider"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                        <Link to={`/seller/orders/${order.id}`} className="inline-flex p-2 text-primary-400 hover:text-white transition bg-primary-500/10 rounded-md">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => updateStatus(order.id, 'cancelled')}
                          disabled={!!updating[order.id] || ['delivered','cancelled'].includes(order.status)}
                          className="inline-flex p-2 text-red-400 hover:text-white transition bg-red-500/10 rounded-md disabled:opacity-40 min-w-[70px] justify-center"
                        >
                          {updating[order.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cancel'}
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

      {/* Assign Rider Modal */}
      <Modal
        open={assignModal.open}
        title={`Assign Rider — Order ${assignModal.order?.order_number}`}
        onClose={() => { if (!assigning) setAssignModal({ open: false, order: null }); }}
      >
        <p className="text-sm text-gray-400 mb-4">Choose one of your delivery riders to handle this order:</p>
        {myRiders.length === 0 ? (
          <div className="py-6 text-center text-gray-500">
            <p>No riders in your team.</p>
            <Link to="/seller/riders" className="text-primary-400 text-sm hover:underline mt-2 block">Go to Manage Riders →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myRiders.map(rider => (
              <button
                key={rider.id}
                disabled={assigning}
                onClick={() => assignRider(rider.user_id)}
                className="w-full flex items-center justify-between bg-navy-950 border border-white/10 hover:border-primary-500 rounded-xl p-4 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 font-bold">
                    {rider.user?.name?.[0] || 'R'}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{rider.user?.name}</p>
                    <p className="text-xs text-gray-400">{rider.vehicle_type} • {rider.vehicle_plate || 'No plate'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${rider.is_available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {rider.is_available ? 'Available' : 'Busy'}
                  </span>
                  <span className="text-primary-400 text-sm opacity-0 group-hover:opacity-100 transition">Assign →</span>
                </div>
              </button>
            ))}
          </div>
        )}
        {assigning && <p className="text-center text-primary-400 text-sm mt-4">Assigning rider...</p>}
      </Modal>
    </div>
  );
}
