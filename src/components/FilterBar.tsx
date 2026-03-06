import { useMemo } from 'react';
import { Filters, SortField, SortOrder, Movie } from '@/types/movie';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Star, Eye, EyeOff, Heart, Film, Tv, X, ArrowUpDown, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortFieldChange: (field: SortField) => void;
  onSortOrderToggle: () => void;
  activeFilterCount: number;
  visible?: boolean;
  movies: Movie[];
}

export function FilterBar({
  filters, onFilterChange, onClearFilters,
  sortField, sortOrder, onSortFieldChange, onSortOrderToggle,
  activeFilterCount, visible = true, movies
}: FilterBarProps) {
  const genres = useMemo(() => {
    const allGenres = new Set<string>();
    movies.forEach(m => {
      if (m.genre) m.genre.split(', ').forEach(g => allGenres.add(g.trim()));
    });
    return Array.from(allGenres).sort();
  }, [movies]);
  return (
    <div className={cn(
      "sticky top-16 z-40 border-b border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-300",
      visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
    )}>
      <div className="container mx-auto px-4 py-3 space-y-3">
        {/* Row 1: Type, Format, Status toggles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Type</span>
            <ToggleGroup
              type="single"
              value={filters.type || 'all'}
              onValueChange={v => onFilterChange('type', v === 'all' ? '' : v || '')}
              size="sm"
              className="bg-secondary/50 rounded-lg p-0.5"
            >
              <ToggleGroupItem value="all" className="text-xs h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Tous</ToggleGroupItem>
              <ToggleGroupItem value="movie" className="text-xs h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground gap-1">
                <Film size={12} /> Film
              </ToggleGroupItem>
              <ToggleGroupItem value="series" className="text-xs h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground gap-1">
                <Tv size={12} /> Série
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Status toggles */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Statut</span>
            <div className="flex gap-1 bg-secondary/50 rounded-lg p-0.5">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-2.5 text-xs rounded-md gap-1',
                  filters.watched === 'yes' && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground',
                  filters.watched === 'no' && 'bg-destructive/80 text-destructive-foreground hover:bg-destructive/70 hover:text-destructive-foreground'
                )}
                onClick={() => {
                  if (filters.watched === '') onFilterChange('watched', 'yes');
                  else if (filters.watched === 'yes') onFilterChange('watched', 'no');
                  else onFilterChange('watched', '');
                }}
              >
                {filters.watched === 'no' ? <EyeOff size={12} /> : <Eye size={12} />}
                {filters.watched === '' ? 'Vu' : filters.watched === 'yes' ? 'Vus' : 'Non vus'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-2.5 text-xs rounded-md gap-1',
                  filters.favorite === 'yes' && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                )}
                onClick={() => onFilterChange('favorite', filters.favorite === 'yes' ? '' : 'yes')}
              >
                <Heart size={12} /> Favori
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-2.5 text-xs rounded-md gap-1',
                  filters.inMyList === 'yes' && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                )}
                onClick={() => onFilterChange('inMyList', filters.inMyList === 'yes' ? '' : 'yes')}
              >
                <Bookmark size={12} /> Ma liste
              </Button>
            </div>
          </div>
        </div>

        {/* Row 2: Genre, Rating stars, Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Genre */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Genre</span>
            <Select value={filters.genre || 'all'} onValueChange={v => onFilterChange('genre', v === 'all' ? '' : v)}>
              <SelectTrigger className="w-32 h-7 text-xs bg-secondary/50 border-border/50"><SelectValue placeholder="Tous" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous genres</SelectItem>
                {genres.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Note</span>
            <div className="flex gap-0.5 bg-secondary/50 rounded-lg p-0.5 px-1.5 items-center">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    const current = filters.rated ? parseInt(filters.rated) : 0;
                    onFilterChange('rated', current === star ? '' : String(star));
                  }}
                  className={cn(
                    'transition-colors p-0.5',
                    filters.rated && star === parseInt(filters.rated)
                      ? 'text-primary'
                      : star <= (parseInt(filters.rated) || 0)
                        ? 'text-primary/40'
                        : 'text-muted-foreground/30 hover:text-muted-foreground/60'
                  )}
                >
                  <Star size={16} fill={star <= (parseInt(filters.rated) || 0) ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div className="border-l border-border/50 h-5 mx-1" />

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Tri</span>
            <ToggleGroup
              type="single"
              value={sortField}
              onValueChange={v => v && onSortFieldChange(v as SortField)}
              size="sm"
              className="bg-secondary/50 rounded-lg p-0.5"
            >
              <ToggleGroupItem value="title" className="text-xs h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Nom</ToggleGroupItem>
              <ToggleGroupItem value="year" className="text-xs h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Année</ToggleGroupItem>
              <ToggleGroupItem value="rating" className="text-xs h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Note</ToggleGroupItem>
            </ToggleGroup>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs gap-1"
              onClick={onSortOrderToggle}
            >
              <ArrowUpDown size={12} />
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </Button>
          </div>

          {activeFilterCount > 0 && (
            <>
              <div className="border-l border-border/50 h-5 mx-1" />
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={onClearFilters}>
                <X size={12} /> Effacer ({activeFilterCount})
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
