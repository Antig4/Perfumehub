import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../stores/authStore';
import ProductCard from '../components/ProductCard';
import { Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const { isAuthenticated } = useAuthStore();
  
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState({
    category_id: searchParams.get('category_id') || '',
    brand_id: searchParams.get('brand_id') || '',
    gender: searchParams.get('gender') || '',
    sort: searchParams.get('sort') || 'newest',
    search: searchParams.get('search') || ''
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/categories'),
      api.get('/brands')
    ]).then(([cats, brs]) => {
      setCategories(cats.data?.data || cats.data || []);
      setBrands(brs.data?.data || brs.data || []);
    }).catch(e => console.error(e));
  }, []);

  // Sync search param from URL if it changes (e.g. from Navbar search form)
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== filters.search && q !== null) {
      setFilters(prev => ({ ...prev, search: q }));
    } else if (!q && filters.search) {
      setFilters(prev => ({ ...prev, search: '' }));
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Only include non-empty filter values so backend doesn't receive empty params
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== '' && v !== null && typeof v !== 'undefined') params.append(k, v);
        });
        const { data } = await api.get(`/products?${params.toString()}`);
        let prods = data?.data || data || [];
        // If authenticated, fetch wishlist and mark products accordingly so hearts persist
        if (isAuthenticated) {
          try {
            const wRes = await api.get('/wishlist');
            const wdata = wRes.data?.data || wRes.data || [];
            const wishSet = new Set(wdata.map(w => (w.product?.id || w.product_id)).filter(Boolean));
            prods = (Array.isArray(prods) ? prods : []).map(p => ({ ...p, in_wishlist: !!wishSet.has(p.id) }));
          } catch (e) {
            // ignore wishlist fetch errors; products still render
          }
        }
        setProducts(prods); // Sanctum pagination wrapper
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
    // Keep product wishlist flags in sync when other parts of the app change wishlist
    const onWishlistUpdate = (e) => {
      const detail = e.detail || {};
      const { productId, in_wishlist } = detail;
      if (!productId) return;
      setProducts(prev => (Array.isArray(prev) ? prev.map(p => p.id === productId ? { ...p, in_wishlist: !!in_wishlist } : p) : prev));
    };
    window.addEventListener('wishlist:updated', onWishlistUpdate);

    return () => {
      window.removeEventListener('wishlist:updated', onWishlistUpdate);
    };
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL
    const newParams = new URLSearchParams(searchParams);
    if (!value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="max-w-none mx-auto px-4 sm:px-6 lg:px-12 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2">Our Collection</h1>
          <p className="text-gray-400">Explore our curated selection of fine fragrances.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            className="md:hidden btn-outline flex-1"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="w-5 h-5" /> Filters
          </button>
          
          <div className="relative w-full md:w-64">
            <select 
              className="input-field appearance-none pr-10"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="popular">Most Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className={`md:w-64 shrink-0 space-y-8 ${isFilterOpen ? 'fixed inset-y-0 left-0 z-50 w-64 block md:block' : 'hidden md:block'}`}>
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 text-white font-medium text-lg mb-6 border-b border-white/5 pb-4">
              <SlidersHorizontal className="w-5 h-5 text-primary-500" /> Filters
            </div>

            <div className="space-y-6">
              {/* Category */}
              <div>
                <h3 className="text-primary-400 text-sm font-semibold uppercase tracking-wider mb-3">Scent Family</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition">
                    <input type="radio" name="cat" checked={filters.category_id === ''} onChange={() => handleFilterChange('category_id', '')} className="accent-primary-500 w-4 h-4" />
                     All Scents
                  </label>
                  {(Array.isArray(categories) ? categories : []).map(c => (
                    <label key={c.id} className="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition">
                      <input type="radio" name="cat" checked={String(filters.category_id) === String(c.id)} onChange={() => handleFilterChange('category_id', c.id)} className="accent-primary-500 w-4 h-4" />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              {/* Gender */}
              <div>
                <h3 className="text-primary-400 text-sm font-semibold uppercase tracking-wider mb-3">Gender</h3>
                <div className="space-y-2">
                  {['', 'female', 'male', 'unisex'].map(g => (
                    <label key={g} className="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition capitalize">
                      <input type="radio" name="gender" checked={filters.gender === g} onChange={() => handleFilterChange('gender', g)} className="accent-primary-500 w-4 h-4" />
                      {g || 'All'}
                    </label>
                  ))}
                </div>
              </div>

              {/* Brands */}
              <div>
                <h3 className="text-primary-400 text-sm font-semibold uppercase tracking-wider mb-3">Brands</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  <label className="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition">
                    <input type="radio" name="brand" checked={filters.brand_id === ''} onChange={() => handleFilterChange('brand_id', '')} className="accent-primary-500 w-4 h-4" />
                    All Brands
                  </label>
                  {(Array.isArray(brands) ? brands : []).map(b => (
                    <label key={b.id} className="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition">
                      <input type="radio" name="brand" checked={String(filters.brand_id) === String(b.id)} onChange={() => handleFilterChange('brand_id', b.id)} className="accent-primary-500 w-4 h-4" />
                      {b.name}
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Backdrop for mobile filter overlay */}
        {isFilterOpen && (
          <div onClick={() => setIsFilterOpen(false)} className="md:hidden fixed inset-0 bg-black/40 z-40" />
        )}

  {/* Product Grid */}
  <div className={`flex-1 ${isFilterOpen ? 'md:ml-64' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              // Render placeholders (null product) to keep layout stable while fetching
              Array.from({ length: 6 }).map((_, i) => (
                <ProductCard key={`ph-${i}`} product={null} />
              ))
            ) : (products.length > 0 ? (
              (Array.isArray(products) ? products : []).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-24 glass-card">
                <h3 className="text-xl text-gray-300 mb-2">No fragrances found</h3>
                <p className="text-gray-500">Try adjusting your filters to see more results.</p>
                <button onClick={() => {
                  setFilters({category_id: '', brand_id: '', gender: '', sort: 'newest'});
                  setSearchParams({});
                }} className="mt-4 text-primary-400 font-medium">Clear Filters</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
