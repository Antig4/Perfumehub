import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from './Modal';


export default function OrderPreview({ orderId, open, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || !orderId) return;
    let mounted = true;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/seller/orders/${orderId}`);
        const payload = res.data && res.data.data ? res.data.data : res.data;
        if (mounted) setOrder(payload);
      } catch (err) {
        // ignore; modal will show empty state
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchOrder();
    return () => { mounted = false; };
  }, [open, orderId]);

  return (
    <Modal open={open} title={`Order #${order?.order_number ?? order?.id ?? orderId}`} onClose={onClose}>
      {loading ? (
        <div className="py-8 text-center text-gray-400">Loading order...</div>
      ) : !order ? (
        <div className="py-6 text-center text-gray-400">Order details not available.</div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-400">Customer: <span className="text-white">{order.user?.name || order.customer_name || '—'}</span></div>
          <div className="text-sm text-gray-400">Total: <span className="text-white">₦{Number(order.total).toLocaleString()}</span></div>
          <div className="pt-2">
            <h4 className="text-xs text-primary-400 mb-2">Items</h4>
            <div className="space-y-2">
              {order.items?.map(i => (
                <div key={i.id} className="flex justify-between text-sm text-gray-300">
                  <div>{i.product_name || i.name} x{i.quantity}</div>
                  <div>₦{Number(i.price ?? i.unit_price ?? 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-right flex items-center justify-end gap-3">
            <button onClick={onClose} className="btn-outline py-2 px-4">Close</button>
            <button onClick={() => { onClose(); navigate(`/seller/orders/${order.id}`); }} className="btn-primary py-2 px-4">Manage Order</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
