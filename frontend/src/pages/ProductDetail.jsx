import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../stores/authStore';
import StarRating from '../components/StarRating';
import ReviewsSection from '../components/ReviewsSection';
import { ShoppingCart, Heart, ShieldCheck, Truck, ArrowLeft, Zap, Store, Star } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="h-4 bg-navy-900 rounded w-20 mb-8"></div>
        <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
          <div className="md:w-1/2 aspect-[4/5] bg-navy-900 rounded-2xl"></div>
          <div className="md:w-1/2 space-y-6 pt-4">
            <div className="h-4 bg-navy-900 rounded w-1/4"></div>
            <div className="h-12 bg-navy-900 rounded w-3/4"></div>
            <div className="h-6 bg-navy-900 rounded w-1/3"></div>
            <div className="h-8 bg-navy-900 rounded w-1/4 mt-8"></div>
            <div className="h-32 bg-navy-900 rounded w-full mt-8"></div>
            <div className="h-12 bg-navy-900 rounded w-full mt-12"></div>
          </div>
        </div>
      </div>
    );
  }

  const primaryImage = product.primary_image?.image_url || product.images?.[0]?.image_url || 'https://placehold.co/600x800/1a1a2e/d4af37?text=PerfumeHub';

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
        <div className="md:w-1/2 relative bg-navy-900 rounded-2xl overflow-hidden aspect-[4/5] shadow-2xl">
          <img 
            src={primaryImage} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="md:w-1/2 flex flex-col pt-4">
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

          {/* ── Action buttons (redesigned) ─────────────────── */}
          <div className="flex flex-col gap-4 mb-8 mt-auto">
            {/* Quantity row */}
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-sm">Qty</span>
              <div className="inline-flex items-center rounded-xl border border-white/15 bg-navy-950/60 overflow-hidden">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity(prev => Math.max(1, (Number(prev) || 1) - 1))}
                  disabled={Number(quantity) <= 1}
                  className="w-10 h-10 flex items-center justify-center text-lg font-light text-gray-300 hover:bg-white/5 disabled:opacity-40 transition"
                >
                  −
                </button>
                <input
                  type="number" min={1} max={product.stock || 9999}
                  value={quantity}
                  onChange={e => {
                    const raw = e.target.value;
                    if (raw === '') { setQuantity(''); return; }
                    let v = parseInt(raw, 10);
                    if (!Number.isFinite(v) || v <= 0) v = 1;
                    setQuantity(Math.min(v, product.stock || 9999));
                  }}
                  onBlur={() => setQuantity(Math.max(1, Number(quantity) || 1))}
                  className="w-14 text-center font-bold text-white bg-transparent outline-none no-spin text-base"
                  style={{ MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity(prev => {
                    const cur = Number(prev) || 0;
                    return product.stock ? Math.min(cur + 1, product.stock) : cur + 1;
                  })}
                  disabled={product.stock ? Number(quantity) >= product.stock : false}
                  className="w-10 h-10 flex items-center justify-center text-lg font-light text-gray-300 hover:bg-white/5 disabled:opacity-40 transition"
                >
                  +
                </button>
              </div>
              {product.stock !== undefined && (
                <span className="text-xs text-gray-500">{product.stock} in stock</span>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-3">
              {/* Add to Cart — glass pill */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || product.stock < 1 || (product.stock && quantity > product.stock)}
                aria-label="Add to cart"
                className="flex-1 flex items-center justify-center gap-2.5 h-13 py-3.5 rounded-2xl border border-primary-500/60 bg-primary-500/10 text-primary-300 font-semibold text-sm hover:bg-primary-500/20 hover:border-primary-400 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4.5 h-4.5" />
                {product.stock < 1 ? 'Out of Stock' : addingToCart ? 'Adding…' : 'Add to Cart'}
              </button>

              {/* Buy Now — solid gradient pill */}
              <button
                onClick={handleBuyNow}
                disabled={buyingNow || product.stock < 1 || (product.stock && quantity > product.stock)}
                aria-label="Buy now"
                className="flex-1 flex items-center justify-center gap-2.5 h-13 py-3.5 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white font-bold text-sm shadow-lg shadow-primary-500/25 hover:shadow-primary-400/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="w-4.5 h-4.5" />
                {buyingNow ? 'Processing…' : 'Buy Now'}
              </button>

              {/* Wishlist heart */}
              <button
                onClick={toggleWishlist}
                title="Add to Wishlist"
                className={`w-12 h-12 flex items-center justify-center rounded-2xl border transition-all duration-200 ${
                  inWishlist
                    ? 'border-red-500/50 bg-red-500/15 text-red-400'
                    : 'border-white/15 bg-navy-950/60 text-gray-400 hover:border-red-500/40 hover:text-red-400'
                }`}
              >
                <Heart className={`w-5 h-5 transition-all ${inWishlist ? 'fill-red-400' : ''}`} />
              </button>
            </div>

            {product.stock && quantity > product.stock && (
              <p className="text-xs text-yellow-400">Selected quantity exceeds available stock.</p>
            )}
          </div>

          {/* Trust Badges */}
          <div className="space-y-3 pt-6 border-t border-white/10 mb-6">
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <ShieldCheck className="w-4.5 h-4.5 text-primary-500 shrink-0" />
              <span>100% Authentic sourced directly from verified sellers</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <Truck className="w-4.5 h-4.5 text-primary-500 shrink-0" />
              <span>Nationwide secured delivery (3-5 days)</span>
            </div>
          </div>

          {/* ── Seller / Store card ────────────────────────── */}
          {product.seller && (
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-navy-950/50 hover:border-primary-500/30 hover:bg-navy-950/70 transition group">
              {/* Store avatar */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0 shadow-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Sold by</p>
                <p className="text-white font-semibold text-sm leading-tight truncate">
                  {product.seller?.seller_profile?.store_name || product.seller?.name || 'PerfumeHub Store'}
                </p>
                {product.seller?.seller_profile?.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-primary-400 fill-primary-400" />
                    <span className="text-xs text-gray-400">
                      {Number(product.seller.seller_profile.rating).toFixed(1)}
                      {product.seller.seller_profile.total_sales > 0 && (
                        <span className="ml-1 text-gray-600">· {product.seller.seller_profile.total_sales} sales</span>
                      )}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-primary-400 group-hover:text-primary-300 font-medium shrink-0">
                ✓ Verified
              </div>
            </div>
          )}
        </div>{/* end md:w-2/3 info column */}
      </div>{/* end flex row */}

      {/* Customer Reviews Section */}
      <ReviewsSection productId={product.id} />

    </div>
  );
}
