import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Banknote, ArrowLeft, ShieldCheck, Wallet, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import MapPicker from '../components/MapPicker';
import MapViewer from '../components/MapViewer';
import Modal from '../components/Modal';

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    shipping_address: '',
    contact_phone: '',
    payment_method: 'cod',
    lat: null,
    lng: null,
    notes: ''
  });

  const [mapOpen, setMapOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [mockPaymentStatus, setMockPaymentStatus] = useState('idle'); // idle, processing, success
  const [paymentInput, setPaymentInput] = useState('');

  // Pre-fill phone, address, and map coordinates from the user's profile
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contact_phone: user.phone || prev.contact_phone,
        shipping_address: user.address || prev.shipping_address,
        lat: user.lat || prev.lat,
        lng: user.lng || prev.lng,
      }));
    }
  }, [user]);

  useEffect(() => {
    api.get('/cart').then(({ data }) => {
      if (!data.data?.items?.length) navigate('/cart');
      else setCart(data.data);
      setLoading(false);
    }).catch(() => navigate('/cart'));
  }, [navigate]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (formData.payment_method !== 'cod') {
      setPaymentModalOpen(true);
      setMockPaymentStatus('idle');
      setPaymentInput('');
      return;
    }
    await processFinalOrder();
  };

  const processFinalOrder = async () => {
    setProcessing(true);
    
    try {
      await api.post('/checkout', formData);
      toast.success(formData.payment_method === 'cod' ? 'Order placed successfully! Pay upon delivery.' : 'Payment successful! Order placed.');
      navigate('/orders');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Checkout failed');
      setProcessing(false);
      setPaymentModalOpen(false);
    }
  };

  const handleMockPayment = async (e) => {
    e.preventDefault();
    setMockPaymentStatus('processing');
    // Simulate payment gateway delay
    setTimeout(() => {
      setMockPaymentStatus('success');
      // Auto submit after success animation
      setTimeout(() => {
        setPaymentModalOpen(false);
        processFinalOrder();
      }, 1500);
    }, 2500);
  };

  if (loading || !cart) return <div className="p-12 text-center text-gray-400">Loading checkout...</div>;

  const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const total = subtotal + 100; // Flat shipping

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-3xl font-serif text-white mb-8">Secure Checkout</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form */}
        <div className="lg:w-2/3">
          <form className="space-y-8" onSubmit={handleCreateOrder}>
            
            {/* Delivery Info */}
            <div className="glass-card p-6 sm:p-8">
              <h2 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4">Delivery Information</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Full Delivery Address</label>
                  <textarea required className="input-field min-h-[100px]" placeholder="Street, Barangay, City, Province" value={formData.shipping_address} onChange={e => setFormData({...formData, shipping_address: e.target.value})}></textarea>
                  {user?.address && formData.shipping_address !== user.address && (
                    <button type="button" onClick={() => setFormData(prev => ({...prev, shipping_address: user.address}))} className="text-xs text-primary-400 hover:text-primary-300 mt-1 transition">
                      ← Reset to profile address
                    </button>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => setMapOpen(true)} className="btn-outline">Pick on Map</button>
                    {formData.lat && formData.lng && (
                      <>
                        <span className="text-sm text-gray-400">Coords: {formData.lat.toFixed(5)}, {formData.lng.toFixed(5)}</span>
                        <button type="button" onClick={() => setViewerOpen(true)} className="ml-2 text-sm btn-outline">Preview</button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Contact Phone Number</label>
                  <input type="text" required className="input-field" placeholder="+63 912 345 6789" value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} />
                  {user?.phone && formData.contact_phone !== user.phone && (
                    <button type="button" onClick={() => setFormData(prev => ({...prev, contact_phone: user.phone}))} className="text-xs text-primary-400 hover:text-primary-300 mt-1 transition">
                      ← Reset to profile phone
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Delivery Notes (Optional)</label>
                  <input type="text" className="input-field" placeholder="Landmarks or delivery instructions" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>
              <MapPicker open={mapOpen} onClose={() => setMapOpen(false)} initial={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng } : null} onSelect={({ lat, lng, address }) => {
                setFormData(prev => ({ ...prev, shipping_address: address || prev.shipping_address, lat, lng }));
                setMapOpen(false);
              }} />
              <MapViewer open={viewerOpen} onClose={() => setViewerOpen(false)} initial={formData.lat && formData.lng ? { lat: formData.lat, lng: formData.lng, address: formData.shipping_address } : null} />
            </div>

            {/* Payment Info */}
            <div className="glass-card p-6 sm:p-8">
               <h2 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4">Payment Method</h2>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 
                 {/* Cash on Delivery */}
                 <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${formData.payment_method === 'cod' ? 'border-primary-500 bg-primary-500/10' : 'border-gray-800 hover:border-gray-600 bg-navy-900'}`}>
                   <input type="radio" name="payment" value="cod" checked={formData.payment_method === 'cod'} onChange={() => setFormData({...formData, payment_method: 'cod'})} className="sr-only" />
                   <Banknote className={`w-8 h-8 ${formData.payment_method === 'cod' ? 'text-green-400' : 'text-gray-500'}`} />
                   <span className="font-medium text-white">Cash on Delivery</span>
                   <span className="text-xs text-gray-400 text-center">Pay in cash when your order arrives.</span>
                 </label>

                 {/* GCash */}
                 <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${formData.payment_method === 'gcash' ? 'border-primary-500 bg-primary-500/10' : 'border-gray-800 hover:border-gray-600 bg-navy-900'}`}>
                   <input type="radio" name="payment" value="gcash" checked={formData.payment_method === 'gcash'} onChange={() => setFormData({...formData, payment_method: 'gcash'})} className="sr-only" />
                   <Wallet className={`w-8 h-8 ${formData.payment_method === 'gcash' ? 'text-primary-500' : 'text-gray-500'}`} />
                   <span className="font-medium text-white">GCash e-Wallet</span>
                   <span className="text-xs text-gray-400 text-center">Pay via GCash mobile wallet.</span>
                 </label>

                 {/* Credit / Debit Card */}
                 <label className={`cursor-pointer border rounded-xl p-4 flex flex-col items-center gap-3 transition-all ${formData.payment_method === 'card' ? 'border-primary-500 bg-primary-500/10' : 'border-gray-800 hover:border-gray-600 bg-navy-900'}`}>
                   <input type="radio" name="payment" value="card" checked={formData.payment_method === 'card'} onChange={() => setFormData({...formData, payment_method: 'card'})} className="sr-only" />
                   <CreditCard className={`w-8 h-8 ${formData.payment_method === 'card' ? 'text-primary-500' : 'text-gray-500'}`} />
                   <span className="font-medium text-white">Credit / Debit Card</span>
                   <span className="text-xs text-gray-400 text-center">Visa, Mastercard & more.</span>
                 </label>

               </div>

               <div className="mt-6 flex items-center gap-2 text-sm text-gray-400 bg-navy-950 p-3 rounded-lg border border-white/5">
                 <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
                 All transactions are secure. Online payments processed by PayMongo.
               </div>
            </div>

            <button type="submit" disabled={processing} className="w-full btn-primary py-4 text-xl font-bold shadow-xl shadow-primary-500/20">
               {processing ? 'Placing Order...' : `Place Order — ₱${total.toLocaleString()}`}
            </button>
          </form>
        </div>

        {/* Small Summary */}
        <div className="lg:w-1/3">
          <div className="glass-card p-6 sticky top-24">
            <h3 className="font-serif text-lg text-white mb-4">In Your Bag</h3>
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {cart.items.map(item => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-20 bg-navy-950 rounded shrink-0 overflow-hidden">
                    <img src={item.product?.primary_image?.image_url || 'https://placehold.co/80x100/1a1a2e/d4af37?text=P'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="text-white font-medium line-clamp-1">{item.product.name}</p>
                    <p className="text-gray-400">Qty: {item.quantity}</p>
                    <p className="text-primary-400 font-medium">₱{(item.product.price * item.quantity).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-white/10 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>₱{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-gray-400"><span>Shipping</span><span>₱100</span></div>
              <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10"><span>Total</span><span className="text-primary-400">₱{total.toLocaleString()}</span></div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                {formData.payment_method === 'cod' && <><Banknote className="w-3.5 h-3.5" /> Cash on Delivery</>}
                {formData.payment_method === 'gcash' && <><Wallet className="w-3.5 h-3.5" /> GCash e-Wallet</>}
                {formData.payment_method === 'card' && <><CreditCard className="w-3.5 h-3.5" /> Credit / Debit Card</>}
              </div>
            </div>
          </div>
        </div>

      </div>
      
      {/* Payment Gateway Mock Modal */}
      <Modal open={paymentModalOpen} title={`Secure Payment via ${formData.payment_method === 'gcash' ? 'GCash' : 'Credit/Debit Card'}`} onClose={() => {
        if (mockPaymentStatus === 'idle') setPaymentModalOpen(false);
      }}>
        {mockPaymentStatus === 'idle' && (
          <form onSubmit={handleMockPayment} className="space-y-4">
            <p className="text-sm text-gray-400 mb-4">You are about to pay <span className="text-primary-400 font-bold">₱{total.toLocaleString()}</span>. This is a sandbox environment.</p>
            
            {formData.payment_method === 'gcash' ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">GCash Mobile Number</label>
                <input type="text" required placeholder="09XX XXX XXXX" value={paymentInput} onChange={e => setPaymentInput(e.target.value)} className="input-field" />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Card Number</label>
                <input type="text" required placeholder="XXXX XXXX XXXX XXXX" value={paymentInput} onChange={e => setPaymentInput(e.target.value)} className="input-field" />
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date</label>
                    <input type="text" required placeholder="MM/YY" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">CVC</label>
                    <input type="text" required placeholder="123" className="input-field" />
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-white/5 flex justify-end gap-2">
              <button type="button" onClick={() => setPaymentModalOpen(false)} className="btn-outline py-2 px-4">Cancel</button>
              <button type="submit" className="btn-primary py-2 px-4">Pay ₱{total.toLocaleString()}</button>
            </div>
          </form>
        )}

        {mockPaymentStatus === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
            <h3 className="text-lg font-medium text-white">Processing Payment...</h3>
            <p className="text-sm text-gray-400 mt-2 text-center">Please do not close this window or press back.</p>
          </div>
        )}

        {mockPaymentStatus === 'success' && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-white">Payment Successful!</h3>
            <p className="text-sm text-gray-400 mt-2">Redirecting to your orders...</p>
          </div>
        )}
      </Modal>

    </div>
  );
}
