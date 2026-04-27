import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Search, ArrowRight } from 'lucide-react';

export default function Brands() {
  const [brands, setBrands]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/brands').then(({ data }) => {
      setBrands(data.data || data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = brands.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-primary-400 text-sm font-semibold uppercase tracking-widest mb-3">Our Collection</p>
        <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">Explore Brands</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Discover the world's most coveted fragrance houses — from timeless heritage brands to modern niche artisans.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-md mx-auto mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search brands…"
          className="input-field pl-11 w-full"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-28 bg-navy-900 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No brands found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map(brand => (
            <Link
              key={brand.id}
              to={`/catalog?brand_id=${brand.id}`}
              className="glass-card p-6 flex flex-col items-center justify-center gap-3 hover:border-primary-500/40 hover:bg-navy-900/60 transition group min-h-[110px]"
            >
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className="h-10 object-contain opacity-80 group-hover:opacity-100 transition" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center text-primary-400 font-serif font-bold text-xl">
                  {brand.name[0]}
                </div>
              )}
              <p className="text-sm font-medium text-gray-300 group-hover:text-white text-center transition leading-tight">
                {brand.name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
