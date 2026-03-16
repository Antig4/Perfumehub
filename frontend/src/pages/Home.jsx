import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await api.get('/products/trending');
        setTrending(data?.data || data || []);
      } catch (e) {
        console.error('Failed to load trending products', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="bg-navy-950 min-h-screen">
      
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex justify-center flex-col overflow-hidden">
        <div className="absolute inset-0 w-full h-full">
          <img 
            src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2000" 
            alt="Luxury Perfume" 
            className="w-full h-full object-cover object-center opacity-40 scale-105 animate-[pulse_20s_ease-in-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10 w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-400 text-sm font-medium tracking-wide mb-8">
            <Sparkles className="w-4 h-4" /> Discover Your Signature Scent
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-serif leading-tight mb-6">
            The Essence of <br/><span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-primary-600">Luxury</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-gray-300 font-light leading-relaxed mb-10">
            A curated collection of authentic designer fragrances and exclusive boutique blends, tailored for you.
          </p>
          <div className="flex justify-center gap-4 flex-col sm:flex-row">
            <Link to="/catalog" className="btn-primary py-4 px-10 text-lg">
              Shop Collection <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-serif text-white mb-2">Trending Now</h2>
            <p className="text-gray-400">The most loved fragrances this week.</p>
          </div>
          <Link to="/catalog?sort=popular" className="text-primary-400 hover:text-primary-300 font-medium flex items-center gap-1 group">
            View All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="animate-pulse bg-navy-900 rounded-2xl h-96 border border-white/5"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
            {(Array.isArray(trending) ? trending : []).slice(0, 4).map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
