import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data.data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, type, currentQty, maxStock) => {
    const newQty = type === 'inc' ? currentQty + 1 : currentQty - 1;
    if (newQty < 1 || newQty > maxStock) return;
    
    try {
      await api.put(`/cart/items/${itemId}`, { quantity: newQty });
      fetchCart();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Error updating quantity');
    }
  };

  const removeItem = async (itemId) => {
    try {
      await api.delete(`/cart/items/${itemId}`);
      toast.success('Item removed');
      fetchCart();
    } catch (e) {
      toast.error('Error removing item');
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-400">Loading cart...</div>;

  if (!cart?.items?.length) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="bg-navy-900 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-primary-500" />
        </div>
        <h2 className="text-3xl font-serif text-white mb-4">Your Cart is Empty</h2>
        <p className="text-gray-400 mb-8">Discover our collection of fine fragrances and find your signature scent.</p>
        <Link to="/catalog" className="btn-primary inline-flex py-3 px-8">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-serif text-white">Shopping Cart</h1>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="lg:w-2/3 space-y-4">
          {cart.items.map(item => (
            <div key={item.id} className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row gap-6 items-center">
              <Link to={`/products/${item.product_id}`} className="w-24 h-32 shrink-0 bg-navy-950 rounded-lg overflow-hidden">
                <img 
                  src={item.product?.primary_image?.image_url || 'https://placehold.co/150x200/1a1a2e/d4af37?text=Perfume'} 
                  alt={item.product?.name} 
                  className="w-full h-full object-cover" 
                />
              </Link>
              
              <div className="flex-1 text-center sm:text-left">
                <p className="text-primary-400 text-xs font-bold uppercase tracking-widest mb-1">{item.product?.brand?.name}</p>
                <Link to={`/products/${item.product_id}`} className="text-lg font-serif text-white hover:text-primary-400 transition mb-1 block">
                  {item.product?.name}
                </Link>
                <p className="text-gray-400 text-sm mb-4">{item.product?.volume_ml}</p>
                <p className="text-xl font-bold text-white">₱{Number(item.product?.price).toLocaleString()}</p>
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-3 bg-navy-950 border border-white/10 rounded-lg px-2 py-1">
                  <button onClick={() => updateQuantity(item.id, 'dec', item.quantity, item.product.stock)} className="w-8 h-8 flex justify-center items-center text-gray-400 hover:text-white transition">−</button>
                  <span className="w-8 text-center font-medium text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 'inc', item.quantity, item.product.stock)} className="w-8 h-8 flex justify-center items-center text-gray-400 hover:text-white transition">+</button>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-sm font-medium text-gray-500 hover:text-red-400 transition flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="glass-card p-6 lg:p-8 sticky top-24">
            <h2 className="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
               <div className="flex justify-between text-gray-300">
                 <span>Subtotal</span>
                 <span className="font-medium text-white">₱{subtotal.toLocaleString()}</span>
               </div>
               <div className="flex justify-between text-gray-300">
                 <span>Shipping Estimate</span>
                 <span className="font-medium text-white">₱100</span>
               </div>
            </div>
            
            <div className="flex justify-between items-end border-t border-white/10 pt-4 mb-8">
               <span className="text-lg text-white">Total</span>
               <span className="text-3xl font-bold text-primary-400">₱{(subtotal + 100).toLocaleString()}</span>
            </div>
            
            <button 
              onClick={() => navigate('/checkout')} 
              className="w-full btn-primary py-4 text-lg"
            >
              Proceed to Checkout <ArrowRight className="w-5 h-5 ml-2" />
            </button>
            <p className="text-xs text-center text-gray-500 mt-4">Taxes and shipping calculated at checkout.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
