import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Package, User, MapPin, Phone, Mail, Clock, CheckCircle2, ChevronRight, ArrowLeft, Truck, AlertCircle } from 'lucide-react';

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
        const payload = res.data?.data || res.data;
        if (mounted) {
          if (payload && payload.id) {
            setOrder(payload);
          } else {
            toast.error('Order data not found.');
          }
        }
      } catch (e) {
        console.error('Failed to load order', e);
        const msg = e.response?.data?.message || 'Failed to load order';
        if (mounted) {
          toast.error(msg);
          if (e.response?.status === 401 || e.response?.status === 403) {
            navigate('/seller/orders');
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();

    return () => { mounted = false; isMounted.current = false; };
  }, [id, navigate]);

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

  const getStatusLabel = (status) => {
    if (status === 'out_for_delivery') return 'READY TO PICK-UP';
    return status.replace(/_/g, ' ');
  };

  const quickAction = () => {
    if (!order) return null;
    switch (order.status) {
      case 'pending': return () => updateStatus('confirmed');
      case 'confirmed': return () => updateStatus('packed');
      case 'packed': return () => updateStatus('out_for_delivery');
      default: return null;
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-gray-400 gap-4">
      <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
      <p className="text-lg font-medium animate-pulse">Loading order details...</p>
    </div>
  );
  if (!order) return (
    <div className="p-12 text-center text-gray-400">
      <div className="mb-4">Order not found or you do not have access to view it.</div>
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => navigate('/seller/orders')} className="btn-outline">Back to Orders</button>
        <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
      </div>
    </div>
  );

  const getStatusStep = () => {
    const steps = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered'];
    return steps.indexOf(order.status);
  };

  return (
    <div className="max-w-none px-6 lg:px-12 py-12 animate-in fade-in duration-500 min-h-screen bg-navy-950">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <button 
              onClick={() => navigate('/seller/orders')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
              <span>Back to Orders</span>
            </button>
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-serif text-white tracking-tight">Order #{order.order_number}</h1>
              <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                order.status === 'delivered' ? 'bg-green-500/20 text-green-400' : 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
              }`}>
                {getStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
            </p>
          </div>

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="flex items-center gap-3 bg-navy-900/50 p-2 rounded-2xl border border-white/5 shadow-xl">
               <select 
                value={order.status} 
                onChange={(e) => updateStatus(e.target.value)} 
                className="bg-transparent text-white text-sm font-semibold outline-none px-4 py-2 cursor-pointer border-r border-white/10"
              >
                <option value="pending" className="bg-navy-900">Pending</option>
                <option value="confirmed" className="bg-navy-900">Confirmed</option>
                <option value="packed" className="bg-navy-900">Packed</option>
                <option value="out_for_delivery" className="bg-navy-900">Ready to Pick-up</option>
                <option value="delivered" className="bg-navy-900">Delivered</option>
                <option value="cancelled" className="bg-navy-900">Cancelled</option>
              </select>
              {quickAction() && (
                <button 
                  onClick={quickAction()} 
                  className="btn-primary py-2 px-6 text-sm font-bold shadow-lg shadow-primary-500/20"
                >
                  {updating ? 'Updating...' : 'Next Status'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Status Stepper */}
        <div className="glass-card mb-10 p-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[600px]">
            {['Pending', 'Confirmed', 'Packed', 'Ready', 'Delivered'].map((step, idx) => {
              const isActive = idx <= getStatusStep();
              const isLast = idx === 4;
              return (
                <div key={step} className="flex-1 flex items-center">
                  <div className="flex flex-col items-center relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isActive ? 'bg-primary-500 border-primary-500 text-navy-950 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'border-white/10 text-gray-500'
                    }`}>
                      {isActive ? <CheckCircle2 className="w-6 h-6" /> : <span className="text-sm font-bold">{idx + 1}</span>}
                    </div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold mt-3 ${isActive ? 'text-white' : 'text-gray-600'}`}>{step}</span>
                  </div>
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-4 bg-white/5 relative overflow-hidden">
                      <div className={`absolute inset-0 bg-primary-500 transition-all duration-1000 transform origin-left ${isActive && idx < getStatusStep() ? 'scale-x-100' : 'scale-x-0'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Items List */}
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary-400">Order Items</h3>
                <span className="text-xs text-gray-500">{order.items?.length} Items Total</span>
              </div>
              <div className="p-0">
                {order.items?.map((item, i) => (
                  <div key={item.id} className={`p-6 flex items-center gap-6 ${i !== order.items.length - 1 ? 'border-b border-white/5' : ''}`}>
                    <div className="w-16 h-20 bg-navy-900 rounded-lg overflow-hidden border border-white/5 shrink-0 shadow-lg">
                      <img 
                        src={item.product?.primary_image?.image_url || item.product_image || 'https://placehold.co/100x120/1a1a2e/d4af37?text=Perfume'} 
                        alt={item.product_name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold text-lg line-clamp-1">{item.product_name}</h4>
                      <p className="text-sm text-gray-400 mt-1">Quantity: <span className="text-white">{item.quantity}</span></p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-white tracking-wide">₱{Number(item.price * item.quantity).toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">₱{Number(item.price).toLocaleString()} / unit</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-navy-900/50 flex justify-between items-center border-t border-white/5">
                <span className="text-gray-400 font-medium">Subtotal</span>
                <span className="text-2xl font-bold text-white">₱{Number(order.subtotal).toLocaleString()}</span>
              </div>
            </div>

            {/* Delivery Details */}
            {order.delivery && (
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary-400 mb-6 flex items-center gap-2">
                  <Truck className="w-4 h-4" /> Fulfillment Info
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Rider Assigned</p>
                      {order.delivery.rider ? (
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-500 flex items-center justify-center text-navy-950 shrink-0">
                            {order.delivery.rider.avatar_url ? (
                              <img src={order.delivery.rider.avatar_url} alt={order.delivery.rider.name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{order.delivery.rider.name}</p>
                            <p className="text-xs text-gray-400">Professional Rider</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-yellow-500 text-sm italic">
                          <AlertCircle className="w-4 h-4" /> Waiting for rider assignment...
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Payment Method</p>
                      <div className="text-white font-medium flex items-center gap-2 capitalize">
                        <div className="w-2 h-2 rounded-full bg-primary-400" />
                        {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Payment Status</p>
                      <span className={`text-xs font-bold uppercase tracking-wider ${order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {order.payment_status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer & Sidebar */}
          <div className="space-y-8">
             {/* Customer Card */}
             <div className="glass-card p-8">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary-400 mb-6 flex items-center gap-2">
                <User className="w-4 h-4" /> Customer Profile
              </h3>
              <div className="flex flex-col items-center text-center mb-8 pb-8 border-b border-white/5">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-navy-800 to-navy-900 border-2 border-primary-500/30 flex items-center justify-center mb-4 shadow-2xl relative shrink-0">
                  {order.user?.avatar_url ? (
                    <img src={order.user.avatar_url} alt={order.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-gray-300" />
                  )}
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-navy-900 shadow-lg" />
                </div>
                <h4 className="text-xl font-bold text-white">{order.user?.name}</h4>
                <p className="text-gray-500 text-sm">{order.user?.email}</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                    <MapPin className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Delivery Address</p>
                    <p className="text-white text-sm leading-relaxed">{order.shipping_address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                    <Phone className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Phone Number</p>
                    <p className="text-white text-sm font-semibold">{(order.delivery?.recipient_phone || order.contact_phone || order.user?.phone) || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                    <Mail className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Email Address</p>
                    <p className="text-white text-sm font-semibold truncate max-w-[180px]">{order.user?.email || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Notes / Internal */}
            <div className="glass-card p-6 bg-primary-500/5 border-primary-500/10">
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary-400 mb-4">Customer Notes</h3>
              <div className="bg-navy-950/40 p-4 rounded-xl border border-white/5">
                <p className="text-sm text-gray-300 italic">
                  {order.notes || "No special instructions provided for this order."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
