import { useState, useMemo, useEffect } from 'react';
import { useMovieCollection, filterAndSortMovies } from '@/hooks/useMovieCollection';
import { MovieCard } from '@/components/MovieCard';
import { MovieCardSkeleton } from '@/components/MovieCardSkeleton';
import { AddMovieDialog } from '@/components/AddMovieDialog';
import { MovieDetailDialog } from '@/components/MovieDetailDialog';
import { LoginDialog } from '@/components/LoginDialog';
import { FilterBar } from '@/components/FilterBar';
import { useAuth } from '@/contexts/AuthContext';
import { Movie, Filters, SortField, SortOrder } from '@/types/movie';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Film, Search, Download, Upload, RefreshCw, MoreVertical, LogOut, X, ArrowUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { exportMoviesToCsv, importMoviesFromCsv } from '@/services/dataManagementService';
import { refreshMoviesFromOmdb } from '@/services/omdbRefreshService';

const defaultFilters: Filters = {
  search: '', genre: '', type: '', watched: '', favorite: '', inMyList: '', rated: ''
};

const Index = () => {
  const { movies, loading, addMovie, updateMovie, removeMovie } = useMovieCollection();
  const { isAdmin, logout } = useAuth();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [filterBarVisible, setFilterBarVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentY = window.scrollY;
      setShowScrollTop(currentY > 300);
      if (currentY < 50) {
        setFilterBarVisible(true);
      } else if (currentY > lastScrollY) {
        setFilterBarVisible(false);
      } else {
        setFilterBarVisible(true);
      }
      lastScrollY = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredMovies = useMemo(
    () => filterAndSortMovies(movies, filters, sortField, sortOrder),
    [movies, filters, sortField, sortOrder]
  );

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && v !== '' && k !== 'search').length;

  const handleRate = (id: string, rating: number) => {
    updateMovie(id, { rating });
    toast.success('Note mise à jour');
  };

  const handleRemove = (id: string, title: string) => {
    if (confirm(`Supprimer "${title}" de la collection ?`)) {
      removeMovie(id);
      toast.success('Film supprimé');
    }
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(defaultFilters);

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Film className="text-primary" size={24} />
            <h1 className="text-lg font-bold text-foreground hidden sm:block">CinéTrack</h1>
          </div>

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Rechercher titre, année, acteurs..."
              value={filters.search}
              onChange={e => updateFilter('search', e.target.value)}
              className="pl-9 pr-8 bg-secondary/50 border-border/50"
            />
            {filters.search && (
              <button
                onClick={() => updateFilter('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {isAdmin && (
              <>
                <AddMovieDialog movies={movies} onAdd={(m) => { addMovie(m); toast.success(`"${m.title}" ajouté !`); }} onUpdate={(id, updates) => { updateMovie(id, updates); toast.success('Film mis à jour !'); }} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreVertical size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => exportMoviesToCsv(movies)}>
                      <Download size={14} className="mr-2" /> Exporter CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => document.getElementById('csv-import')?.click()}>
                      <Upload size={14} className="mr-2" /> Importer CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={refreshing}
                      onClick={async () => {
                        setRefreshing(true);
                        try {
                          const { updates, results } = await refreshMoviesFromOmdb(movies, (done, total) => {
                            toast.loading(`Mise à jour ${done}/${total}...`, { id: 'refresh' });
                          });
                          for (const u of updates) await updateMovie(u.id, u.data);
                          const ok = results.filter(r => r.success).length;
                          const fail = results.filter(r => !r.success).length;
                          toast.success(`${ok} film(s) mis à jour${fail ? `, ${fail} erreur(s)` : ''}`, { id: 'refresh' });
                        } catch {
                          toast.error('Erreur lors de la mise à jour', { id: 'refresh' });
                        }
                        setRefreshing(false);
                      }}
                    >
                      <RefreshCw size={14} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Rafraîchir OMDb
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={async () => { await logout(); toast.info('Déconnecté'); }}>
                      <LogOut size={14} className="mr-2" /> Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <input
                  id="csv-import"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const imported = await importMoviesFromCsv(file);
                      for (const m of imported) await addMovie(m);
                      toast.success(`${imported.length} film(s) importé(s)`);
                    } catch {
                      toast.error("Erreur lors de l'import CSV");
                    }
                    e.target.value = '';
                  }}
                />
              </>
            )}
            {!isAdmin && <LoginDialog />}
          </div>
        </div>
      </header>

      {/* Smart filter bar */}
      <FilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearFilters}
        sortField={sortField}
        sortOrder={sortOrder}
        onSortFieldChange={setSortField}
        onSortOrderToggle={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
        activeFilterCount={activeFilterCount}
        visible={filterBarVisible}
        movies={movies}
      />

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredMovies.length} {filteredMovies.length > 1 ? 'titres' : 'titre'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {Array.from({ length: 16 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {filteredMovies.map(movie => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isAdmin={isAdmin}
                onRate={r => handleRate(movie.id, r)}
                onToggleWatched={() => updateMovie(movie.id, { watched: !movie.watched })}
                onToggleFavorite={() => updateMovie(movie.id, { favorite: !movie.favorite })}
                onToggleMyList={() => updateMovie(movie.id, { inMyList: !movie.inMyList })}
                onClick={() => setSelectedMovie(movie)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Film className="text-muted-foreground/30 mb-4" size={64} />
            <h2 className="text-lg font-medium text-foreground mb-1">
              {movies.length === 0 ? 'Votre collection est vide' : 'Aucun résultat'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {movies.length === 0
                ? isAdmin ? 'Cliquez sur "Ajouter" pour commencer' : 'Activez le mode admin pour ajouter des films'
                : 'Essayez de modifier vos filtres'}
            </p>
          </div>
        )}
      </main>

      <MovieDetailDialog
        movie={selectedMovie}
        open={!!selectedMovie}
        onOpenChange={open => !open && setSelectedMovie(null)}
        onUpdate={(id, updates) => {
          if ((updates as any)._delete) {
            removeMovie(id);
            setSelectedMovie(null);
            toast.success('Film supprimé');
            return;
          }
          updateMovie(id, updates);
          setSelectedMovie(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
        }}
        isAdmin={isAdmin}
      />

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all"
        >
          <ArrowUp size={18} />
        </button>
      )}
    </div>
  );
};

export default Index;
