import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../stores/authStore';
import StarRating from '../components/StarRating';
import { ShoppingBag, Heart, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.data);
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
      await api.post('/cart', { product_id: product.id, quantity });
      toast.success('Added to cart');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleWishlist = async () => {
    if (!isAuthenticated) return navigate('/login');
    try {
      const { data } = await api.post('/wishlist', { product_id: product.id });
      toast.success(data.message);
    } catch (e) {
      toast.error('Failed to update wishlist');
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
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        {/* Images */}
        <div className="md:w-1/2 relative bg-navy-900 rounded-2xl overflow-hidden aspect-[3/4]">
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

          {/* Actions */}
          <div className="flex items-end gap-6 mb-8 mt-auto">
            <div className="w-24">
              <p className="text-gray-400 text-sm mb-2">Quantity</p>
              <select 
                className="input-field text-lg text-center font-bold"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              >
                {[...Array(Math.min(10, product.stock))].map((_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock < 1}
              className="flex-1 btn-primary py-4 text-lg"
            >
              <ShoppingBag className="w-5 h-5" /> 
              {product.stock < 1 ? 'Out of Stock' : addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>

            <button 
              onClick={toggleWishlist}
              className="btn-outline px-4 py-4 aspect-square"
              title="Add to Wishlist"
            >
              <Heart className="w-6 h-6" />
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
