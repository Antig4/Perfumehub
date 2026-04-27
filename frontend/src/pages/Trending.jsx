import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { Flame, ArrowLeft } from 'lucide-react';

export default function Trending() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/products/trending').then(({ data }) => {
      setProducts(data?.data || data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-8 transition group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-primary-400 text-sm font-bold uppercase tracking-[0.2em] mb-4">
              <span className="w-8 h-[1px] bg-primary-500/50"></span>
              <Flame className="w-4 h-4 fill-primary-400" /> Hot Right Now
            </div>
            <h1 className="text-5xl md:text-6xl font-serif text-white mb-4 leading-tight">Trending <span className="text-primary-500 italic">Fragrances</span></h1>
            <p className="text-gray-400 text-lg">Our community's most coveted scents this week — curated by real shoppers and trending across the hub.</p>
          </div>
          <Link to="/catalog?sort=popular" className="inline-flex items-center gap-2 text-white bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full border border-white/10 transition-all font-medium text-sm">
            Shop All Popular <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </div>

      <div className="border-t border-white/5 pt-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[450px] bg-navy-900/50 rounded-3xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-32 glass-card rounded-3xl">
            <Flame className="w-16 h-16 mx-auto mb-6 text-gray-800" />
            <h3 className="text-xl text-white mb-2">No trending products right now</h3>
            <p className="text-gray-500">Check back soon for the latest trends!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product, i) => (
              <div key={product.id} className="relative group/card">
                {i < 3 && (
                  <div className={`absolute -top-4 -left-4 z-20 w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-2xl rotate-[-12deg] group-hover/card:rotate-0 transition-transform duration-300 border border-white/20 ${
                    i === 0 ? 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 text-navy-950 scale-110' :
                    i === 1 ? 'bg-gradient-to-br from-gray-200 via-gray-400 to-gray-500 text-navy-950' :
                              'bg-gradient-to-br from-orange-400 via-orange-600 to-orange-700 text-white'
                  }`}>
                    {i + 1}
                  </div>
                )}
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
