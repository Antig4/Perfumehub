import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

import toast from 'react-hot-toast';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/seller/orders/${id}`);
        const payload = res.data && res.data.data ? res.data.data : res.data;
        if (mounted) setOrder(payload);
      } catch (e) {
          console.error('Failed to load order', e);
          const msg = e.response?.data?.message || 'Failed to load order';
          toast.error(msg);
          // If unauthorized or session expired, redirect back to orders list
          if (e.response?.status === 401 || e.response?.status === 403) {
            navigate('/seller/orders');
          }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    // wire SSE similar to SellerOrders so this detail updates in real-time
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
            for (const o of incoming) {
              if (o.id === Number(id)) {
                if (mounted) setOrder(o);
              }
            }
          } catch (err) {
            // ignore
          }
        };
        es.onerror = () => { if (es) es.close(); es = null; };
      } catch (err) {
        // ignore
      }
    }

    return () => { mounted = false; if (es) es.close(); isMounted.current = false; };
  }, [id]);

  const updateStatus = async (status) => {
    if (!order) return;
    const prevStatus = order.status;
    setUpdating(true);
    setOrder(o => ({ ...o, status }));
    try {
      await api.put(`/seller/orders/${order.id}/status`, { status });
      toast.success('Order status updated');
    } catch (e) {
      toast.error('Failed to update status');
      // revert
      setOrder(o => ({ ...o, status: prevStatus }));
      try { const res = await api.get(`/seller/orders/${id}`); const payload = res.data && res.data.data ? res.data.data : res.data; setOrder(payload); } catch (_) {}
    } finally {
      if (isMounted.current) setUpdating(false);
    }
  };

  const quickAction = () => {
    if (!order) return null;
    switch (order.status) {
      case 'pending': return () => updateStatus('confirmed');
      case 'confirmed': return () => updateStatus('packed');
      case 'packed': return () => updateStatus('out_for_delivery');
      case 'out_for_delivery': return () => updateStatus('delivered');
      default: return null;
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Loading order...</div>;
  if (!order) return (
    <div className="p-12 text-center text-gray-400">
      <div className="mb-4">Order not found or you do not have access to view it.</div>
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => navigate('/seller/orders')} className="btn-outline">Back to Orders</button>
        <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif text-white">Manage Order {order.order_number}</h1>
        <button onClick={() => navigate('/seller/orders')} className="btn-outline">Back to Orders</button>
      </div>

      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm text-gray-400">Customer</h3>
            <p className="text-white font-medium">{order.user?.name}</p>
            <p className="text-sm text-gray-400">{order.user?.email}</p>
            <p className="text-sm text-gray-400 mt-2">{(order.delivery?.recipient_phone || order.contact_phone || order.user?.phone) || 'No phone'}</p>
          </div>
          <div>
            <h3 className="text-sm text-gray-400">Status</h3>
            <div className="flex items-center gap-3">
              {order.status === 'delivered' ? (
                <span className="text-sm font-semibold px-3 py-1 rounded bg-green-500/10 text-green-400">Delivered</span>
              ) : (
                <>
                  <select value={order.status} onChange={(e) => updateStatus(e.target.value)} className="input-field py-1 px-2 text-sm max-w-[220px]">
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="packed">Packed</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  {quickAction() && (
                    <button onClick={quickAction()} className="btn-primary py-1 px-3 text-sm">{updating ? '...' : 'Quick'}</button>
                  )}
                </>
              )}
            </div>
            <div className="mt-3">
              <button onClick={() => window.location.href = `mailto:${order.user?.email}?subject=Regarding your order ${order.order_number}`} className="btn-outline mr-2">Contact Customer</button>
              <button onClick={() => navigate('/seller/orders')} className="btn-outline">Back to Orders</button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm text-primary-400 mb-2">Items</h4>
          <div className="space-y-2">
            {order.items?.map(i => (
              <div key={i.id} className="flex justify-between text-sm text-gray-300">
                <div>{i.product_name} x{i.quantity}</div>
                <div>₱{Number(i.price).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
