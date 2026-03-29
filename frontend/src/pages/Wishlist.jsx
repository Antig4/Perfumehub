import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!isAuthenticated) {
        setItems([]);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/wishlist');
        const data = res.data?.data || res.data || [];
        // backend returns wishlist entries with `product` relation
        // ensure products are marked as in_wishlist so ProductCard shows filled heart
        const products = data.map(w => {
          const p = w.product;
          if (p) p.in_wishlist = true;
          return p;
        }).filter(Boolean);
        setItems(products);
        // notify navbar with absolute count so badge stays in sync when opening wishlist
        try { window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { count: products.length } })); } catch (e) {}
      } catch (e) {
        console.error('Failed to load wishlist', e);
        toast.error('Failed to load wishlist');
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
    // Listen for updates from product cards or other parts of the app
    const onUpdate = async (e) => {
      const detail = e.detail || {};
      const { productId, in_wishlist } = detail;
      if (!productId) return;
      if (in_wishlist === false) {
        // removed: filter out
        setItems(prev => prev.filter(p => p.id !== productId));
      } else if (in_wishlist === true) {
        // added: fetch product and add if not present
        try {
          const res = await api.get(`/products/${productId}`);
          const p = res.data?.data || res.data;
          if (p) {
            p.in_wishlist = true;
            setItems(prev => {
              if (prev.find(x => x.id === p.id)) return prev;
              return [p, ...prev];
            });
          }
        } catch (err) {
          // ignore
        }
      } else if (in_wishlist === true) {
        // (handled above)
      }
    };
    window.addEventListener('wishlist:updated', onUpdate);

    return () => {
      window.removeEventListener('wishlist:updated', onUpdate);
    };
  }, [isAuthenticated]);

  const handleToggle = async (productId) => {
    try {
      const res = await api.post('/wishlist', { product_id: productId });
      toast.success(res.data?.message || 'Updated wishlist');
      // remove if the toggle removed it
      if (res.data?.in_wishlist === false) {
        const updated = setItems(prev => prev.filter(p => p.id !== productId));
        setItems(prev => prev.filter(p => p.id !== productId));
        try { window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: { productId, in_wishlist: false, count: items.length - 1 } })); } catch (e) {}
      }
    } catch (e) {
      console.error('Wishlist toggle failed', e);
      toast.error('Failed to update wishlist');
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-12">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-3xl font-serif text-white">Your Wishlist</h1>
      </div>
      {items.length === 0 ? (
        <div className="text-gray-400">Your wishlist is empty. Browse products and tap the heart to add.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(p => (
            <div key={p.id} className="h-full">
              <ProductCard product={p} />
              <div className="mt-2 flex justify-center">
                <button onClick={() => handleToggle(p.id)} className="text-xs text-primary-400 hover:underline">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
