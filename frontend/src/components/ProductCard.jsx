import { Link } from 'react-router-dom';
import { Star, Flame } from 'lucide-react';

export default function ProductCard({ product }) {
  const isHot = product.sales_count > 100 || product.is_featured;

  return (
    <div className="group glass-card overflow-hidden flex flex-col h-full transition duration-300 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1">
      {/* Image Container */}
      <Link to={`/products/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-navy-950">
        {isHot && (
          <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-red-500/30">
            <Flame className="w-3 h-3" /> HOT
          </div>
        )}
        <img
          src={product.primary_image?.image_path || 'https://via.placeholder.com/400x500?text=No+Image'}
          alt={product.name}
          className="w-full h-full object-cover transition duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
          loading="lazy"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-transparent to-transparent opacity-60" />
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow relative">
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
          <button className="text-sm font-medium text-navy-950 bg-primary-500 hover:bg-primary-400 px-4 py-1.5 rounded-md transition-colors shadow-lg shadow-primary-500/20 active:scale-95">
            View
          </button>
        </div>
      </div>
    </div>
  );
}
