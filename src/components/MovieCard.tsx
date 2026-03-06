import { Heart, Eye, EyeOff, Bookmark } from 'lucide-react';
import { Movie } from '@/types/movie';
import { RatingStars } from './RatingStars';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MovieCardProps {
  movie: Movie;
  isAdmin: boolean;
  onRate: (rating: number) => void;
  onToggleWatched: () => void;
  onToggleFavorite: () => void;
  onToggleMyList: () => void;
  onClick: () => void;
}

export function MovieCard({ movie, isAdmin, onRate, onToggleWatched, onToggleFavorite, onToggleMyList, onClick }: MovieCardProps) {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer rounded-lg overflow-hidden bg-card border border-border/50 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        {movie.poster && movie.poster !== 'N/A' ? (
          <img src={movie.poster} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
            Pas d'affiche
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={cn(
              'p-1.5 rounded-full backdrop-blur-sm transition-all',
              movie.favorite ? 'bg-destructive/80 text-destructive-foreground opacity-100' : 'bg-black/50 text-foreground/70 hover:text-foreground opacity-0 group-hover:opacity-100'
            )}
          >
            <Heart size={12} fill={movie.favorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleMyList(); }}
            className={cn(
              'p-1.5 rounded-full backdrop-blur-sm transition-all',
              movie.inMyList ? 'bg-accent/80 text-accent-foreground opacity-100' : 'bg-black/50 text-foreground/70 hover:text-foreground opacity-0 group-hover:opacity-100'
            )}
          >
            <Bookmark size={12} fill={movie.inMyList ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWatched(); }}
            className={cn(
              'p-1.5 rounded-full backdrop-blur-sm transition-all',
              !movie.watched
                ? 'bg-accent/80 text-accent-foreground opacity-100'
                : 'bg-black/50 text-foreground/70 hover:text-foreground opacity-0 group-hover:opacity-100'
            )}
          >
            {movie.watched ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        </div>

        {movie.type === 'series' && (
          <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs">Série</Badge>
        )}
      </div>

      <div className="p-2 space-y-1">
        <h3 className="font-semibold text-xs text-card-foreground truncate">{movie.title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{movie.year}</span>
          {movie.imdbRating && movie.imdbRating !== 'N/A' && (
            <span className="text-[10px] text-muted-foreground">⭐ {movie.imdbRating}</span>
          )}
        </div>
        <RatingStars rating={movie.rating} onChange={onRate} size="sm" />
      </div>
    </div>
  );
}
