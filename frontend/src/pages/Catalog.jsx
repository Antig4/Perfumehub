import { useState, useEffect } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Filter, SlidersHorizontal, ChevronDown } from 'lucide-react';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    gender: '',
    sort: 'created_at',
    order: 'desc'
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

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams(filters).toString();
        const { data } = await api.get(`/products?${queryParams}`);
        setProducts(data?.data || data || []); // Sanctum pagination wrapper
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              value={`${filters.sort}|${filters.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('|');
                setFilters(prev => ({ ...prev, sort, order }));
              }}
            >
              <option value="created_at|desc">Newest Arrivals</option>
              <option value="sales_count|desc">Most Popular</option>
              <option value="price|asc">Price: Low to High</option>
              <option value="price|desc">Price: High to Low</option>
            </select>
            <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className={`md:w-64 shrink-0 space-y-8 ${isFilterOpen ? 'block' : 'hidden md:block'}`}>
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
                    <input type="radio" name="cat" checked={filters.category === ''} onChange={() => handleFilterChange('category', '')} className="accent-primary-500 w-4 h-4" />
                     All Scents
                  </label>
                  {(Array.isArray(categories) ? categories : []).map(c => (
                    <label key={c.id} className="flex items-center gap-3 cursor-pointer text-gray-300 hover:text-white transition">
                      <input type="radio" name="cat" checked={filters.category === String(c.id)} onChange={() => handleFilterChange('category', c.id)} className="accent-primary-500 w-4 h-4" />
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

            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="animate-pulse bg-navy-900 rounded-2xl h-[450px] border border-white/5"></div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(products) ? products : []).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
             <div className="text-center py-24 glass-card">
               <h3 className="text-xl text-gray-300 mb-2">No fragrances found</h3>
               <p className="text-gray-500">Try adjusting your filters to see more results.</p>
               <button onClick={() => setFilters({category: '', brand: '', gender: '', sort: 'created_at', order: 'desc'})} className="mt-4 text-primary-400 font-medium">Clear Filters</button>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
