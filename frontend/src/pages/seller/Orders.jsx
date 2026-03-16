import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Package, Search, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/seller/orders');
      setOrders(data.data); // Sanctum pagination
    } catch (e) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchOrders();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-serif text-white">Manage Orders</h1>
          <p className="text-gray-400">Process and fulfill customer orders</p>
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
                      <p className="text-sm text-gray-400">{order.user?.phone || 'No phone'}</p>
                    </td>
                    <td className="p-4 text-white font-medium">₱{Number(order.total).toLocaleString()}</td>
                    <td className="p-4">
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
                    </td>
                    <td className="p-4 text-right">
                       <button className="inline-flex p-2 text-primary-400 hover:text-white transition bg-primary-500/10 rounded-md">
                         <ExternalLink className="w-4 h-4" />
                       </button>
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
