import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { searchOmdb, getOmdbDetails, getOmdbByTitle, OmdbSearchResult } from '@/lib/omdb';
import { Movie } from '@/types/movie';
import { Plus, Search, Loader2, ArrowLeft, Eye, EyeOff, Heart, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from './RatingStars';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type SearchMode = 'search' | 'imdb' | 'title';

interface AddMovieDialogProps {
  onAdd: (movie: Movie) => void;
  onUpdate?: (id: string, updates: Partial<Movie>) => void;
  movies?: Movie[];
}

const emptyMovie: Omit<Movie, 'id' | 'addedAt'> = {
  title: '', year: '', poster: '', genre: '', director: '', actors: '',
  plot: '', rated: '', runtime: '', type: 'movie',
  imdbRating: '', rating: 0, notes: '', watched: true,
  favorite: false, inMyList: false,
};

export function AddMovieDialog({ onAdd, onUpdate, movies = [] }: AddMovieDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [searchMode, setSearchMode] = useState<SearchMode>('search');
  const [query, setQuery] = useState('');
  const [queryYear, setQueryYear] = useState('');
  const [results, setResults] = useState<OmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [form, setForm] = useState(emptyMovie);
  const [imdbId, setImdbId] = useState('');
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const resetAll = () => {
    setStep('search');
    setSearchMode('search');
    setQuery('');
    setQueryYear('');
    setResults([]);
    setForm(emptyMovie);
    setImdbId('');
    setPage(1);
    setTotalResults(0);
  };

  const fillFormFromDetail = (d: any) => {
    setForm({
      title: d.Title, year: d.Year, poster: d.Poster, genre: d.Genre,
      director: d.Director, actors: d.Actors, plot: d.Plot,
      rated: d.Rated, runtime: d.Runtime, type: d.Type as Movie['type'],
      imdbRating: d.imdbRating, rating: 0, notes: '', watched: true,
      favorite: false, inMyList: false,
    });
    setImdbId(d.imdbID);
    setStep('form');
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      if (searchMode === 'search') {
        const data = await searchOmdb(query);
        setResults(data.Search || []);
        setTotalResults(parseInt(data.totalResults || '0', 10));
        setPage(1);
      } else if (searchMode === 'imdb') {
        const d = await getOmdbDetails(query.trim());
        if (d.Response === 'True') {
          fillFormFromDetail(d);
        } else {
          setResults([]);
        }
      } else if (searchMode === 'title') {
        const d = await getOmdbByTitle(query.trim(), queryYear.trim() || undefined);
        if (d.Response === 'True') {
          fillFormFromDetail(d);
        } else {
          setResults([]);
        }
      }
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const data = await searchOmdb(query, undefined, nextPage);
      if (data.Search) {
        setResults(prev => [...prev, ...data.Search!]);
        setPage(nextPage);
      }
    } catch {}
    setLoadingMore(false);
  };

  const handleSelectResult = async (result: OmdbSearchResult) => {
    setLoadingDetail(result.imdbID);
    try {
      const existing = movies.find(m => m.id === result.imdbID);
      if (existing) {
        // Show existing movie data in form (including user fields)
        setForm({
          title: existing.title, year: existing.year, poster: existing.poster,
          genre: existing.genre, director: existing.director, actors: existing.actors,
          plot: existing.plot, rated: existing.rated, runtime: existing.runtime,
          type: existing.type, imdbRating: existing.imdbRating,
          rating: existing.rating, notes: existing.notes, watched: existing.watched,
          favorite: existing.favorite, inMyList: existing.inMyList,
        });
        setImdbId(existing.id);
        setStep('form');
      } else {
        const d = await getOmdbDetails(result.imdbID);
        fillFormFromDetail(d);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingDetail(null);
  };

  const handleQuickAdd = async (e: React.MouseEvent, result: OmdbSearchResult) => {
    e.stopPropagation();
    setLoadingDetail(result.imdbID);
    try {
      const d = await getOmdbDetails(result.imdbID);
      const existing = movies.find(m => m.id === result.imdbID);
      if (existing && onUpdate) {
        // Update only OMDb info, preserve user fields
        onUpdate(existing.id, {
          title: d.Title, year: d.Year, poster: d.Poster, genre: d.Genre,
          director: d.Director, actors: d.Actors, plot: d.Plot,
          rated: d.Rated, runtime: d.Runtime, type: d.Type as Movie['type'],
          imdbRating: d.imdbRating,
        });
      } else {
        const movie: Movie = {
          id: d.imdbID,
          title: d.Title, year: d.Year, poster: d.Poster, genre: d.Genre,
          director: d.Director, actors: d.Actors, plot: d.Plot,
          rated: d.Rated, runtime: d.Runtime, type: d.Type as Movie['type'],
          imdbRating: d.imdbRating, rating: 0, notes: '', watched: true,
          favorite: false, inMyList: false, addedAt: new Date().toISOString(),
        };
        onAdd(movie);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingDetail(null);
  };

  const handleManual = () => {
    setForm(emptyMovie);
    setImdbId('');
    setStep('form');
  };

  const isExisting = !!movies.find(m => m.id === imdbId);

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (isExisting && onUpdate) {
      onUpdate(imdbId, { ...form });
    } else {
      const movie: Movie = {
        ...form,
        id: imdbId || `manual-${Date.now()}`,
        addedAt: new Date().toISOString(),
      };
      onAdd(movie);
    }
    resetAll();
    setOpen(false);
  };

  const updateField = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetAll(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus size={16} /> <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[92vw] max-h-[85vh] overflow-hidden flex flex-col" hideDefaultClose>
        <DialogHeader>
          <DialogTitle>
            {step === 'search' ? 'Ajouter un film ou une série' : 'Détails du film'}
          </DialogTitle>
        </DialogHeader>

        {step === 'search' ? (
          <>
            <ToggleGroup
              type="single"
              value={searchMode}
              onValueChange={(v) => { if (v) { setSearchMode(v as SearchMode); setResults([]); setQuery(''); setQueryYear(''); } }}
              className="justify-start bg-secondary/50 rounded-lg p-0.5 w-fit"
              size="sm"
            >
              <ToggleGroupItem value="search" className="text-xs h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Recherche</ToggleGroupItem>
              <ToggleGroupItem value="imdb" className="text-xs h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Id IMDb</ToggleGroupItem>
              <ToggleGroupItem value="title" className="text-xs h-7 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Titre</ToggleGroupItem>
            </ToggleGroup>

            <div className="flex gap-2">
              <Input
                placeholder={
                  searchMode === 'search' ? 'Rechercher sur OMDb...' :
                  searchMode === 'imdb' ? 'tt0029187' : 'Titre du film...'
                }
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              {searchMode === 'title' && (
                <Input
                  placeholder="Année"
                  value={queryYear}
                  onChange={e => setQueryYear(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="w-24 shrink-0"
                />
              )}
              <Button onClick={handleSearch} disabled={loading} size="icon" variant="secondary">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mt-2">
              {results.map(r => (
                <div key={r.imdbID} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer" onClick={() => handleSelectResult(r)}>
                  <img
                    src={r.Poster !== 'N/A' ? r.Poster : '/placeholder.svg'}
                    alt={r.Title}
                    className="w-12 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.Title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.Year}</span>
                      <Badge variant="outline" className="text-[10px]">{r.Type}</Badge>
                    </div>
                  </div>
                  {loadingDetail === r.imdbID ? (
                    <Loader2 size={14} className="animate-spin text-muted-foreground" />
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0 rounded-full hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={(e) => handleQuickAdd(e, r)}
                      title="Ajout rapide"
                    >
                      <Plus size={16} />
                    </Button>
                  )}
                </div>
              ))}
              {results.length === 0 && !loading && query && (
                <p className="text-center text-sm text-muted-foreground py-8">Aucun résultat trouvé</p>
              )}
              {searchMode === 'search' && results.length > 0 && results.length < totalResults && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1"
                  disabled={loadingMore}
                  onClick={handleLoadMore}
                >
                  {loadingMore ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                  Plus de résultats
                </Button>
              )}
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleManual}>
              Ajouter manuellement
            </Button>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <Button variant="ghost" size="sm" className="gap-1 -ml-2" onClick={() => setStep('search')}>
              <ArrowLeft size={14} /> Retour à la recherche
            </Button>

            {form.poster && form.poster !== 'N/A' && (
              <img src={form.poster} alt={form.title} className="w-24 h-auto rounded-lg mx-auto" />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Titre *</Label>
                <Input value={form.title} onChange={e => updateField('title', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Année</Label>
                <Input value={form.year} onChange={e => updateField('year', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Durée</Label>
                <Input value={form.runtime} onChange={e => updateField('runtime', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Réalisateur</Label>
                <Input value={form.director} onChange={e => updateField('director', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Acteurs</Label>
                <Input value={form.actors} onChange={e => updateField('actors', e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Genre</Label>
                <Input value={form.genre} onChange={e => updateField('genre', e.target.value)} placeholder="Action, Drama, ..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={form.type} onValueChange={v => updateField('type', v as Movie['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Film</SelectItem>
                    <SelectItem value="series">Série</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Affiche (URL)</Label>
                <Input value={form.poster} onChange={e => updateField('poster', e.target.value)} placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Synopsis</Label>
                <Textarea value={form.plot} onChange={e => updateField('plot', e.target.value)} rows={3} className="resize-none" />
              </div>
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Classification (MPAA)</Label>
                <Input value={form.rated} onChange={e => updateField('rated', e.target.value)} placeholder="PG-13, R, ..." />
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Ma note</Label>
                <RatingStars rating={form.rating} onChange={r => updateField('rating', r)} />
              </div>
              <div className="flex gap-1 bg-secondary/50 rounded-lg p-0.5 w-fit">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs rounded-md gap-1',
                    form.watched && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                  )}
                  onClick={() => updateField('watched', !form.watched)}
                >
                  {form.watched ? <Eye size={12} /> : <EyeOff size={12} />} Vu
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs rounded-md gap-1',
                    form.favorite && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                  )}
                  onClick={() => updateField('favorite', !form.favorite)}
                >
                  <Heart size={12} /> Favori
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-7 px-2.5 text-xs rounded-md gap-1',
                    form.inMyList && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                  )}
                  onClick={() => updateField('inMyList', !form.inMyList)}
                >
                  <Bookmark size={12} /> Ma liste
                </Button>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Notes personnelles</Label>
                <Textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} rows={2} className="resize-none" placeholder="Ajouter des notes..." />
              </div>
            </div>

            <Button className="w-full" onClick={handleSubmit} disabled={!form.title.trim()}>
              <Plus size={16} /> {isExisting ? 'Mettre à jour' : 'Ajouter à la collection'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
