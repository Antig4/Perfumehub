import { Link } from 'react-router-dom';
import { Star, Flame, Heart } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import React from 'react';

function ProductCard({ product }) {
  // product may be null for skeleton placeholders
  const isSkeleton = !product;
  const isHot = !isSkeleton && (product.sales_count > 100 || product.is_featured);
  const { isAuthenticated } = useAuthStore();
  const [liked, setLiked] = useState(!!(product && product.in_wishlist));
  const [toggling, setToggling] = useState(false);

  // Keep liked state in sync if parent updates product.in_wishlist
  useEffect(() => {
    setLiked(!!(product && product.in_wishlist));
  }, [product && product.in_wishlist]);

  // Listen for global wishlist updates and update this card if it refers to the same product
  useEffect(() => {
    const onUpdate = (e) => {
      const detail = e.detail || {};
      // Guard: ignore updates when this is a skeleton placeholder
      if (!product || !detail.productId) return;
      if (detail.productId === product.id) {
        if (typeof detail.in_wishlist === 'boolean') setLiked(!!detail.in_wishlist);
        else if (typeof detail.count === 'number') {
          // count provided but not specific state; preserve existing liked
        }
      }
    };
    window.addEventListener('wishlist:updated', onUpdate);
    return () => window.removeEventListener('wishlist:updated', onUpdate);
  }, [product ? product.id : null]);

  const toggleWishlist = async (e) => {
    if (isSkeleton) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return window.location.href = '/login';
    // optimistic UI: toggle immediately
    const optimistic = !liked;
    setLiked(optimistic);
    setToggling(true);
    try {
      const res = await api.post('/wishlist', { product_id: product.id });
      const final = !!res.data?.in_wishlist;
      setLiked(final);
      toast.success(res.data?.message || 'Updated wishlist');

      try {
        window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { productId: product.id, in_wishlist: final } }));
      } catch (e) {}
    } catch (err) {
      console.error('Failed wishlist toggle', err);
      setLiked(!optimistic);
      toast.error('Failed to update wishlist');
      try {
        window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { productId: product.id, in_wishlist: !optimistic } }));
      } catch (e) {}
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className={`group glass-card overflow-hidden flex flex-col h-full transition duration-300 hover:shadow-2xl hover:shadow-primary-500/10 ${isSkeleton ? '' : 'hover:-translate-y-1'}`} style={{ minHeight: 460 }}>
      {/* Image Container - reserve space using aspect ratio and an inner img wrapper so image scaling doesn't affect layout */}
      <Link to={product ? `/products/${product.id}` : '#'} className="relative block aspect-[4/5] overflow-hidden bg-navy-950">
        {isHot && (
          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-red-500/30">
            <Flame className="w-3 h-3" /> HOT
          </div>
        )}

        <div className="w-full h-full relative">
          {isSkeleton ? (
            <div className="w-full h-full bg-navy-900 animate-pulse" />
          ) : (
            <img
              src={product.primaryImage?.image_path || product.primary_image?.image_path || 'https://via.placeholder.com/400x500?text=No+Image'}
              alt={product.name}
              className="w-full h-full object-cover opacity-90"
              loading="lazy"
            />
          )}
        </div>

        {/* wishlist heart */}
        <button onClick={toggleWishlist} className="absolute top-3 right-3 z-20 bg-navy-900/60 p-2 rounded-full text-white hover:scale-105 transition">
          <Heart className={`w-5 h-5 ${liked ? 'text-red-400' : 'text-white'}`} />
        </button>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent opacity-60" />
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow relative">
        {isSkeleton ? (
          <>
            <div className="h-4 bg-navy-900 rounded w-32 mb-3 animate-pulse" />
            <div className="h-5 bg-navy-900 rounded w-full mb-2 animate-pulse" />
            <div className="h-3 bg-navy-900 rounded w-20 mb-6 animate-pulse" />
            <div className="mt-auto flex items-center justify-between">
              <div className="h-6 bg-navy-900 rounded w-24 animate-pulse" />
              <div className="h-8 bg-navy-900 rounded w-20 animate-pulse" />
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold tracking-wider text-primary-400/80 uppercase">
                {product.brand?.name || 'Brand'}
              </span>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-medium text-gray-300">{Number(product.rating).toFixed(1)}</span>
              </div>
            </div>

            <Link to={`/products/${product.id}`} className="block mt-1">
              <h3 className="font-serif text-lg leading-tight text-white group-hover:text-primary-400 transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>
            
            <p className="text-gray-400 text-sm mt-1 mb-4">{product.volume_ml}</p>

            <div className="mt-auto flex items-center justify-between">
              <p className="text-lg font-bold text-white tracking-wide">
                ₱{Number(product.price).toLocaleString()}
              </p>
              <Link to={`/products/${product.id}`} className="text-sm font-medium text-navy-950 bg-primary-500 hover:bg-primary-400 px-4 py-1.5 rounded-md transition-colors shadow-lg shadow-primary-500/20 active:scale-95">
                View
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default React.memo(ProductCard);
