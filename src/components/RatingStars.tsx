import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 14, md: 18, lg: 24 };

export function RatingStars({ rating, onChange, size = 'md', className }: RatingStarsProps) {
  return (
    <div className={cn('flex gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange?.(rating === star ? 0 : star);
          }}
          disabled={!onChange}
          className={cn(
            'transition-colors',
            onChange ? 'cursor-pointer hover:text-primary' : 'cursor-default',
            star <= rating ? 'text-primary' : 'text-muted-foreground/30'
          )}
        >
          <Star size={sizes[size]} fill={star <= rating ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}
