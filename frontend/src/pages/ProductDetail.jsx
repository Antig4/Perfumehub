import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../stores/authStore';
import StarRating from '../components/StarRating';
import { ShoppingCart, Heart, ShieldCheck, Truck, ArrowLeft, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        const p = data.data;
        setProduct(p);
        setInWishlist(!!p.in_wishlist);
        // If API didn't include in_wishlist but user is authenticated, query wishlist to confirm
        if (isAuthenticated && !p.in_wishlist) {
          try {
            const wres = await api.get('/wishlist');
            const wdata = wres.data?.data || wres.data || [];
            const found = (Array.isArray(wdata) ? wdata : []).some(w => {
              const pid = w.product?.id || w.product_id;
              return pid === p.id;
            });
            if (found) {
              setInWishlist(true);
              setProduct(prev => prev ? { ...prev, in_wishlist: true } : prev);
            }
          } catch (e) {
            // ignore wishlist probe failures
          }
        }
      } catch (e) {
        toast.error('Failed to load product details');
        navigate('/catalog');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast('Please login to add to cart', { icon: '🔒' });
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      const qty = Number(quantity) || 1;
      await api.post('/cart', { product_id: product.id, quantity: qty });
      toast.success('Added to cart');
      try { window.dispatchEvent(new CustomEvent('cart:updated', { detail: { delta: qty } })); } catch (e) {}
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast('Please login to continue', { icon: '🔒' });
      navigate('/login');
      return;
    }

    setBuyingNow(true);
    try {
      const qty = Number(quantity) || 1;
      await api.post('/cart', { product_id: product.id, quantity: qty });
      try { window.dispatchEvent(new CustomEvent('cart:updated', { detail: { delta: qty } })); } catch (e) {}
      // go to checkout immediately
      navigate('/checkout');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to proceed to checkout');
    } finally {
      setBuyingNow(false);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) return navigate('/login');
    // optimistic update
    const optimistic = !inWishlist;
    setInWishlist(optimistic);
    try { window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { productId: product.id, in_wishlist: optimistic } })); } catch (e) {}
    setTogglingWishlist(true);
    try {
      const { data } = await api.post('/wishlist', { product_id: product.id });
      const final = !!data.in_wishlist;
      setInWishlist(final);
      try { window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { productId: product.id, in_wishlist: final } })); } catch (e) {}
      toast.success(data.message);
    } catch (e) {
      // revert optimistic
      setInWishlist(!optimistic);
      try { window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { productId: product.id, in_wishlist: !optimistic } })); } catch (e) {}
      toast.error('Failed to update wishlist');
    } finally {
      setTogglingWishlist(false);
    }
  };

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse flex flex-col md:flex-row gap-12">
        <div className="md:w-1/2 h-[600px] bg-navy-900 rounded-2xl"></div>
        <div className="md:w-1/2 space-y-6">
          <div className="h-8 bg-navy-900 rounded w-1/4"></div>
          <div className="h-12 bg-navy-900 rounded w-3/4"></div>
          <div className="h-24 bg-navy-900 rounded w-full"></div>
        </div>
      </div>
    );
  }

  const primaryImage = product.primary_image?.image_path || 'https://via.placeholder.com/600x800';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Component-scoped styles to remove native number input spinners */}
      <style>{`
        /* Chrome, Safari, Edge, Opera */
        .no-spin::-webkit-outer-spin-button,
        .no-spin::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        /* Firefox */
        .no-spin {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        {/* Images */}
        <div className="md:w-1/3 relative bg-navy-900 rounded-2xl overflow-hidden aspect-[3/4]">
          <img 
            src={primaryImage} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="md:w-2/3 flex flex-col pt-4">
          <div className="mb-2 text-primary-400 font-semibold uppercase tracking-widest text-sm">
            {product.brand?.name}
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight">
            {product.name}
          </h1>
          
          <div className="flex items-center gap-4 mb-8">
            <StarRating rating={Number(product.rating)} size="lg" showCount count={product.review_count} />
            <span className="text-gray-500">•</span>
            <span className="text-gray-300 capitalize">{product.volume_ml}</span>
          </div>

          <p className="text-3xl font-bold text-white mb-8">
            ₱{Number(product.price).toLocaleString()}
          </p>

          <p className="text-gray-300 text-lg leading-relaxed mb-8 font-light">
            {product.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10 py-6 border-y border-white/10">
            <div>
              <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider">Scent Family</p>
              <p className="text-white font-medium">{product.category?.name || 'Blend'}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider">Notes</p>
              <p className="text-white font-medium">{product.scent_notes || 'N/A'}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-6 mb-8 mt-auto">
            <div>
              <p className="text-gray-400 text-sm mb-2">Quantity</p>
              <div className="inline-flex items-center border border-white/10 rounded overflow-hidden">
                <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(prev => {
                  const v = Number(prev) || 1; return Math.max(1, v - 1);
                })} className="px-3 py-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-50" disabled={Number(quantity) <= 1}>
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={product.stock || 9999}
                  value={quantity}
                  onChange={(e) => {
                    const raw = e.target.value;
                    // Allow empty string while typing (user can erase to type multi-digit)
                    if (raw === '') { setQuantity(''); return; }
                    let v = parseInt(raw, 10);
                    if (!Number.isFinite(v) || v <= 0) v = 1;
                    const max = product.stock || 9999;
                    if (v > max) v = max;
                    setQuantity(v);
                  }}
                  onBlur={() => {
                    // Normalize empty input to 1 on blur
                    if (quantity === '' || quantity === null || typeof quantity === 'undefined') setQuantity(1);
                    else {
                      let v = Number(quantity) || 1;
                      const max = product.stock || 9999;
                      if (v < 1) v = 1;
                      if (v > max) v = max;
                      setQuantity(v);
                    }
                  }}
                  className="w-20 text-lg text-center font-bold bg-transparent outline-none p-2 no-spin"
                  style={{ MozAppearance: 'textfield', WebkitAppearance: 'none', appearance: 'textfield' }}
                />
                <button type="button" aria-label="Increase quantity" onClick={() => setQuantity(prev => {
                  const cur = Number(prev) || 0;
                  const next = cur + 1;
                  return product.stock ? Math.min(next, product.stock) : next;
                })} className="px-3 py-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-50" disabled={product.stock ? Number(quantity) >= product.stock : false}>
                  +
                </button>
              </div>
              {product.stock !== undefined && (
                <div className="text-xs text-gray-500 mt-1">Available: {product.stock}</div>
              )}
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock < 1 || (product.stock && quantity > product.stock)}
              className="btn-outline w-36 py-3 text-base flex items-center justify-center whitespace-nowrap"
              title="Add to cart (continue shopping)"
              aria-label="Add to cart"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {product.stock < 1 ? 'Out of Stock' : addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button onClick={handleBuyNow} disabled={buyingNow || product.stock < 1 || (product.stock && quantity > product.stock)} className="w-44 py-4 text-lg flex items-center justify-center whitespace-nowrap ml-2 rounded-md shadow-lg transition disabled:opacity-60 bg-amber-400 hover:bg-amber-300 text-navy-900 px-5" title="Buy Now — add to cart and go straight to checkout" aria-label="Buy now">
              {buyingNow ? 'Processing...' : (<><Zap className="w-6 h-6 mr-3 text-navy-900" />Buy Now</>)}
            </button>

            {product.stock && quantity > product.stock && (
              <div className="text-sm text-yellow-400 mt-2">Selected quantity exceeds available stock.</div>
            )}

            <button 
              onClick={toggleWishlist}
              className="btn-outline px-4 py-3 aspect-square flex items-center justify-center"
              title="Add to Wishlist"
            >
              <Heart className={`w-5 h-5 transition-colors ${inWishlist ? 'text-red-400' : 'text-white'}`} />
            </button>
          </div>

          {/* Trust Badges */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 text-gray-400">
              <ShieldCheck className="w-5 h-5 text-primary-500" />
              <span>100% Authentic sourced directly from verified sellers</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <Truck className="w-5 h-5 text-primary-500" />
              <span>Nationwide secured delivery (3-5 days)</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
