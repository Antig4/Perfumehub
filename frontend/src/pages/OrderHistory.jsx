import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Truck, CheckCircle2, RotateCcw, Star, Camera, Image, Video, X, Send } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/* ─── Star Picker ─────────────────────────────────────── */
function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star className={`w-9 h-9 transition-colors ${n <= (hovered || value) ? 'text-primary-400 fill-primary-400' : 'text-gray-600'}`} />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-400 min-w-[70px]">{labels[hovered || value]}</span>
    </div>
  );
}

/* ─── Write Review Modal ──────────────────────────────── */
function WriteReviewModal({ product, orderId, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (mediaFiles.length + files.length > 5) { toast.error('Max 5 files allowed'); return; }
    const previews = files.map(f => ({
      url: URL.createObjectURL(f),
      type: f.type.startsWith('video') ? 'video' : 'image',
    }));
    setMediaFiles(p => [...p, ...files]);
    setMediaPreviews(p => [...p, ...previews]);
  };

  const removeMedia = (i) => {
    setMediaFiles(p => p.filter((_, idx) => idx !== i));
    setMediaPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating'); return; }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('product_id', product.product_id);
      form.append('order_id', orderId);
      form.append('rating', rating);
      if (comment) form.append('comment', comment);
      mediaFiles.forEach((f, i) => form.append(`media[${i}]`, f));
      await api.post('/reviews', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Review submitted!');
      onSubmitted(product.product_id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-navy-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={product.product_image || 'https://placehold.co/48x60/1a1a2e/d4af37?text=P'}
              alt={product.product_name}
              className="w-12 h-14 object-cover rounded-lg"
            />
            <div>
              <p className="text-xs text-gray-400">Reviewing</p>
              <p className="text-white font-semibold line-clamp-1">{product.product_name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Stars */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Your Rating *</label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Review <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              className="input-field min-h-[110px] resize-y"
              placeholder="Describe the scent, longevity, packaging quality..."
              maxLength={2000}
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <p className="text-xs text-gray-600 text-right mt-0.5">{comment.length}/2000</p>
          </div>

          {/* Media */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Photos & Videos <span className="text-gray-500">(up to 5)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {mediaPreviews.map((p, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10 group shrink-0">
                  {p.type === 'video'
                    ? <div className="w-full h-full bg-navy-950 flex items-center justify-center"><Video className="w-6 h-6 text-gray-400" /></div>
                    : <img src={p.url} alt="" className="w-full h-full object-cover" />
                  }
                  <button type="button" onClick={() => removeMedia(i)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
              {mediaFiles.length < 5 && (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 hover:border-primary-400 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-primary-400 transition shrink-0">
                  <Image className="w-6 h-6" />
                  <span className="text-[10px]">Add</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleMediaChange} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Cancel</button>
            <button type="submit" disabled={submitting || rating === 0}
              className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-60">
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────── */
export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null });
  const [cancelReason, setCancelReason] = useState('changed_mind');
  const [cancelNotes, setCancelNotes] = useState('');
  const [reviewModal, setReviewModal] = useState({ open: false, product: null, orderId: null });
  const [reviewedProducts, setReviewedProducts] = useState(new Set()); // product_ids already reviewed this session
  const navigate = useNavigate();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      const list = (data.data || []).filter(o => o.status !== 'cancelled');
      setOrders(list);
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

  const markReviewed = (productId) => {
    setReviewedProducts(prev => new Set([...prev, productId]));
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
                {order.items?.map(item => {
                  const alreadyReviewed = reviewedProducts.has(item.product_id);
                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <Link to={`/products/${item.product_id}`} className="w-16 h-20 bg-navy-950 rounded overflow-hidden shrink-0">
                        <img src={item.product_image || 'https://placehold.co/64x80/1a1a2e/d4af37?text=P'} alt={item.product_name} className="w-full h-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${item.product_id}`} className="text-white hover:text-primary-400 font-medium transition line-clamp-1">
                          {item.product_name}
                        </Link>
                        <p className="text-sm text-gray-400">Qty: {item.quantity} × ₱{Number(item.price).toLocaleString()}</p>
                      </div>
                      {/* Write Review button — only for delivered orders */}
                      {order.status === 'delivered' && (
                        alreadyReviewed ? (
                          <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium shrink-0">
                            <CheckCircle2 className="w-4 h-4" /> Reviewed
                          </div>
                        ) : (
                          <button
                            onClick={() => setReviewModal({ open: true, product: item, orderId: order.id })}
                            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary-400 border border-primary-500/40 hover:bg-primary-500/10 px-3 py-1.5 rounded-lg transition"
                          >
                            <Star className="w-3.5 h-3.5 fill-primary-400" />
                            Write Review
                          </button>
                        )
                      )}
                    </div>
                  );
                })}

                {/* Cancel for pending/confirmed */}
                {(['pending', 'confirmed'].includes(order.status)) && (
                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button onClick={() => setCancelModal({ open: true, orderId: order.id })} className="btn-outline text-sm py-2">
                      Cancel Order
                    </button>
                  </div>
                )}

                {/* Delivered — prompt to leave reviews */}
                {order.status === 'delivered' && (
                  <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-gray-500">
                    <Star className="w-3.5 h-3.5 text-primary-400 fill-primary-400" />
                    Click <span className="text-primary-400 font-medium">"Write Review"</span> next to each item to share your experience!
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-navy-900 p-6 rounded-xl w-full max-w-md border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Cancel Order</h3>
            <p className="text-sm text-gray-400 mb-4">Why are you cancelling this order?</p>
            <div className="space-y-3 text-gray-300 text-sm">
              {[
                ['changed_mind', 'Changed my mind'],
                ['found_cheaper', 'Found it cheaper elsewhere'],
                ['delivery_time', 'Delivery time too long'],
                ['other', 'Other'],
              ].map(([val, label]) => (
                <label key={val} className="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="reason" checked={cancelReason === val} onChange={() => setCancelReason(val)} />
                  {label}
                </label>
              ))}
              <textarea
                placeholder="Additional details (optional)"
                value={cancelNotes}
                onChange={e => setCancelNotes(e.target.value)}
                className="input-field min-h-[80px] mt-2"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setCancelModal({ open: false, orderId: null })} className="btn-outline">Close</button>
              <button onClick={async () => {
                try {
                  await api.post(`/orders/${cancelModal.orderId}/cancel`, { reason: cancelReason, notes: cancelNotes });
                  toast.success('Order cancelled.');
                  setCancelModal({ open: false, orderId: null });
                  fetchOrders();
                } catch (e) {
                  toast.error(e.response?.data?.message || 'Failed to cancel order');
                }
              }} className="btn-primary">Submit & Cancel Order</button>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {reviewModal.open && reviewModal.product && (
        <WriteReviewModal
          product={reviewModal.product}
          orderId={reviewModal.orderId}
          onClose={() => setReviewModal({ open: false, product: null, orderId: null })}
          onSubmitted={markReviewed}
        />
      )}
    </div>
  );
}
