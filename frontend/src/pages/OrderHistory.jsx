import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { Package, Truck, CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null });
  const [cancelReason, setCancelReason] = useState('changed_mind');
  const [cancelNotes, setCancelNotes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      // Hide cancelled orders from the default customer view
      const list = (data.data || []).filter(o => o.status !== 'cancelled');
      setOrders(list); // Pagination payload
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <RotateCcw className="w-5 h-5 text-gray-400" />;
      case 'confirmed': return <Package className="w-5 h-5 text-primary-400" />;
      case 'packed': return <Package className="w-5 h-5 text-blue-400" />;
      case 'out_for_delivery': return <Truck className="w-5 h-5 text-yellow-400" />;
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-gray-500/20 text-gray-300';
      case 'confirmed': return 'bg-primary-500/20 text-primary-400';
      case 'packed': return 'bg-blue-500/20 text-blue-400';
      case 'out_for_delivery': return 'bg-yellow-500/20 text-yellow-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-400">Loading orders...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-serif text-white">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="glass-card py-20 text-center">
          <p className="text-xl text-gray-300 mb-4">You haven't placed any orders yet.</p>
          <Link to="/catalog" className="btn-primary inline-flex">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="glass-card overflow-hidden">
              {/* Header */}
              <div className="bg-navy-950/50 p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Order Placed: {new Date(order.created_at).toLocaleDateString()}</p>
                  <p className="text-lg font-medium text-white">{order.order_number}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)} {order.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-sm font-medium text-primary-400">Total: ₱{Number(order.total).toLocaleString()}</p>
                </div>
              </div>

              {/* Items */}
              <div className="p-4 sm:p-6 space-y-4">
                {order.items?.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <Link to={`/products/${item.product_id}`} className="w-16 h-20 bg-navy-950 rounded overflow-hidden shrink-0">
                      <img src={item.product_image || 'https://via.placeholder.com/150'} alt={item.product_name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1">
                      <Link to={`/products/${item.product_id}`} className="text-white hover:text-primary-400 font-medium transition line-clamp-1">
                        {item.product_name}
                      </Link>
                      <p className="text-sm text-gray-400">Qty: {item.quantity} × ₱{Number(item.price).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {/* Actions: allow cancel for pending/confirmed */}
                {(['pending','confirmed'].includes(order.status)) && (
                  <div className="p-4 border-t border-white/5 flex justify-end">
                    <button onClick={() => setCancelModal({ open: true, orderId: order.id })} className="btn-outline mr-3">Cancel Order</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Cancel feedback modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-navy-900 p-6 rounded w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Cancel Order</h3>
            <p className="text-sm text-gray-400 mb-4">Why are you cancelling this order?</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3"><input type="radio" name="reason" checked={cancelReason==='changed_mind'} onChange={() => setCancelReason('changed_mind')} /> Changed my mind</label>
              <label className="flex items-center gap-3"><input type="radio" name="reason" checked={cancelReason==='found_cheaper'} onChange={() => setCancelReason('found_cheaper')} /> Found it cheaper elsewhere</label>
              <label className="flex items-center gap-3"><input type="radio" name="reason" checked={cancelReason==='delivery_time'} onChange={() => setCancelReason('delivery_time')} /> Delivery time too long</label>
              <label className="flex items-center gap-3"><input type="radio" name="reason" checked={cancelReason==='other'} onChange={() => setCancelReason('other')} /> Other</label>
              <textarea placeholder="Additional details (optional)" value={cancelNotes} onChange={e => setCancelNotes(e.target.value)} className="input-field min-h-[80px]" />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setCancelModal({ open: false, orderId: null })} className="btn-outline">Close</button>
              <button onClick={async () => {
                try {
                  await api.post(`/orders/${cancelModal.orderId}/cancel`, { reason: cancelReason, notes: cancelNotes });
                  toast.success('Order cancelled. Thank you for your feedback.');
                  setCancelModal({ open: false, orderId: null });
                  // refresh orders
                  fetchOrders();
                } catch (e) {
                  toast.error(e.response?.data?.message || 'Failed to cancel order');
                }
              }} className="btn-primary">Submit & Cancel Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
