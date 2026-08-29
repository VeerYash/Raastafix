import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  score: number; // 0 to 5
  totalReviews?: number;
  interactive?: boolean;
  onRate?: (stars: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  score,
  totalReviews,
  interactive = false,
  onRate,
  size = 'md',
  showNumber = true,
}) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  const currentScore = hovered !== null ? hovered : score;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = currentScore >= star;
          const half = !filled && currentScore >= star - 0.5;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRate && onRate(star)}
              onMouseEnter={() => interactive && setHovered(star)}
              onMouseLeave={() => interactive && setHovered(null)}
              className={`${
                interactive
                  ? 'cursor-pointer p-0.5 hover:scale-110 transition-transform focus:outline-none focus:ring-1 focus:ring-amber-500 rounded'
                  : 'cursor-default'
              }`}
              aria-label={`${star} star${star > 1 ? 's' : ''}`}
            >
              <Star
                className={`${starSizes} ${
                  filled
                    ? 'fill-amber-400 text-amber-400 dark:fill-amber-400 dark:text-amber-400'
                    : half
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'fill-stone-200 text-stone-300 dark:fill-stone-700 dark:text-stone-600'
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>

      {showNumber && (
        <span className="font-mono-data text-xs font-semibold text-stone-800 dark:text-stone-200">
          {score.toFixed(1)}
        </span>
      )}

      {totalReviews !== undefined && (
        <span className="text-xs text-stone-500 dark:text-stone-400">
          ({totalReviews})
        </span>
      )}
    </div>
  );
};
