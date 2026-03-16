import { Star, StarHalf } from 'lucide-react';

export default function StarRating({ rating = 0, size = "md", showCount = false, count = 0 }) {
  const roundedRating = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(roundedRating);
  const hasHalfStar = roundedRating % 1 !== 0;
  const emptyStars = 5 - Math.ceil(roundedRating);

  const starSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  const currentSize = starSizes[size] || starSizes.md;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex text-primary-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={`${currentSize} fill-current`} />
        ))}
        
        {hasHalfStar && <StarHalf className={`${currentSize} fill-current`} />}
        
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${currentSize} text-gray-700`} />
        ))}
      </div>
      
      {showCount && (
        <span className="text-gray-400 text-sm ml-1">
          {rating.toFixed(1)} ({count} reviews)
        </span>
      )}
    </div>
  );
}
