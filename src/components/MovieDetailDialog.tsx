import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Movie } from '@/types/movie';
import { RatingStars } from './RatingStars';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getYoutubeTrailerUrl } from '@/lib/omdb';
import { refreshSingleMovieFromOmdb } from '@/services/omdbRefreshService';
import { Youtube, Pencil, Check, X, Trash2, ChevronDown, ChevronUp, RefreshCw, Eye, EyeOff, Heart, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MovieDetailDialogProps {
  movie: Movie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<Movie>) => void;
  isAdmin: boolean;
}

export function MovieDetailDialog({ movie, open, onOpenChange, onUpdate, isAdmin }: MovieDetailDialogProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Movie>>({});
  const [plotExpanded, setPlotExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (movie) setForm({ ...movie });
    setEditing(false);
    setPlotExpanded(false);
  }, [movie]);

  if (!movie) return null;

  const genres = movie.genre ? movie.genre.split(', ') : [];

  const startEdit = () => {
    setForm({ ...movie });
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm({ ...movie });
    setEditing(false);
  };

  const saveEdit = () => {
    const { id, addedAt, ...updates } = form as Movie;
    onUpdate(movie.id, updates);
    setEditing(false);
  };

  const updateField = (key: keyof Movie, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[92vw] max-h-[85vh] flex flex-col overflow-hidden p-0" hideDefaultClose>
        <div className="p-6 pb-0">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="text-xl">{editing ? 'Modifier le film' : movie.title}</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => onOpenChange(false)}>
                <X size={16} />
              </Button>
            </div>
            {isAdmin && !editing && (
              <div className="flex items-center gap-1 pt-1 justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" onClick={startEdit}>
                  <Pencil size={14} />
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 hidden sm:inline-flex" onClick={startEdit}>
                  <Pencil size={14} /> Modifier
                </Button>
                {movie.id && !movie.id.startsWith('manual-') && (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden" disabled={refreshing} onClick={async () => {
                      setRefreshing(true);
                      try {
                        const data = await refreshSingleMovieFromOmdb(movie.id);
                        onUpdate(movie.id, data);
                        toast.success('Film actualisé depuis OMDb');
                      } catch { toast.error("Erreur lors de l'actualisation"); }
                      setRefreshing(false);
                    }}>
                      <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1 hidden sm:inline-flex" disabled={refreshing} onClick={async () => {
                      setRefreshing(true);
                      try {
                        const data = await refreshSingleMovieFromOmdb(movie.id);
                        onUpdate(movie.id, data);
                        toast.success('Film actualisé depuis OMDb');
                      } catch { toast.error("Erreur lors de l'actualisation"); }
                      setRefreshing(false);
                    }}>
                      <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Actualiser
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive sm:hidden" onClick={() => {
                  if (confirm(`Supprimer "${movie.title}" ?`)) {
                    onUpdate(movie.id, { _delete: true } as any);
                    onOpenChange(false);
                  }
                }}>
                  <Trash2 size={14} />
                </Button>
                <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive hidden sm:inline-flex" onClick={() => {
                  if (confirm(`Supprimer "${movie.title}" ?`)) {
                    onUpdate(movie.id, { _delete: true } as any);
                    onOpenChange(false);
                  }
                }}>
                  <Trash2 size={14} /> Supprimer
                </Button>
              </div>
            )}
          </DialogHeader>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-6">
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Titre</Label>
                  <Input value={form.title || ''} onChange={e => updateField('title', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Année</Label>
                  <Input value={form.year || ''} onChange={e => updateField('year', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Durée</Label>
                  <Input value={form.runtime || ''} onChange={e => updateField('runtime', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Réalisateur</Label>
                  <Input value={form.director || ''} onChange={e => updateField('director', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Acteurs</Label>
                  <Input value={form.actors || ''} onChange={e => updateField('actors', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Genre</Label>
                  <Input value={form.genre || ''} onChange={e => updateField('genre', e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={form.type || 'movie'} onValueChange={v => updateField('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Film</SelectItem>
                      <SelectItem value="series">Série</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Classification</Label>
                  <Input value={form.rated || ''} onChange={e => updateField('rated', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Affiche (URL)</Label>
                  <Input value={form.poster || ''} onChange={e => updateField('poster', e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Synopsis</Label>
                  <Textarea value={form.plot || ''} onChange={e => updateField('plot', e.target.value)} rows={3} className="resize-none" />
                </div>
                <div className="space-y-5 pt-2">
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
                  <RatingStars rating={form.rating || 0} onChange={r => updateField('rating', r)} size="md" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6">
              <div className="space-y-3">
                {movie.poster && movie.poster !== 'N/A' ? (
                  <img src={movie.poster} alt={movie.title} className="w-full rounded-lg" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                    Pas d'affiche
                  </div>
                )}
                <a
                  href={getYoutubeTrailerUrl(movie.title, movie.year)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-md bg-destructive/90 hover:bg-destructive text-destructive-foreground text-sm font-medium transition-colors"
                >
                  <Youtube size={16} /> Bande-annonce
                </a>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {genres.map(g => <Badge key={g} variant="secondary">{g}</Badge>)}
                  {movie.rated && movie.rated !== 'N/A' && <Badge variant="outline">{movie.rated}</Badge>}
                  <Badge variant="outline">{movie.type === 'series' ? 'Série' : 'Film'}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Année:</span> {movie.year}</div>
                  <div><span className="text-muted-foreground">Durée:</span> {movie.runtime}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Réalisateur:</span> {movie.director}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">Acteurs:</span> {movie.actors}</div>
                  {movie.id && !movie.id.startsWith('manual-') && (
                    <div className="col-span-2">
                      <a
                        href={`http://www.imdb.com/title/${movie.id}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        Voir sur IMDb ↗
                      </a>
                    </div>
                  )}
                  {movie.imdbRating && movie.imdbRating !== 'N/A' && (
                    <div><span className="text-muted-foreground">IMDb:</span> ⭐ {movie.imdbRating}/10</div>
                  )}
                </div>

                <div>
                  <div className={`text-sm text-muted-foreground leading-relaxed ${!plotExpanded ? 'line-clamp-4' : ''}`}>
                    {movie.plot}
                  </div>
                  {movie.plot && movie.plot.length > 200 && (
                    <Button variant="ghost" size="sm" className="gap-1 mt-1 h-7 px-2 text-xs" onClick={() => setPlotExpanded(!plotExpanded)}>
                      {plotExpanded ? <><ChevronUp size={12} /> Voir moins</> : <><ChevronDown size={12} /> Voir plus</>}
                    </Button>
                  )}
                </div>

                <div className="space-y-5 pt-1">
                  <div className="flex gap-1 bg-secondary/50 rounded-lg p-0.5 w-fit">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-7 px-2.5 text-xs rounded-md gap-1',
                        movie.watched && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                      )}
                      onClick={() => onUpdate(movie.id, { watched: !movie.watched })}
                    >
                      {movie.watched ? <Eye size={12} /> : <EyeOff size={12} />} Vu
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-7 px-2.5 text-xs rounded-md gap-1',
                        movie.favorite && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                      )}
                      onClick={() => onUpdate(movie.id, { favorite: !movie.favorite })}
                    >
                      <Heart size={12} /> Favori
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-7 px-2.5 text-xs rounded-md gap-1',
                        movie.inMyList && 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground'
                      )}
                      onClick={() => onUpdate(movie.id, { inMyList: !movie.inMyList })}
                    >
                      <Bookmark size={12} /> Ma liste
                    </Button>
                  </div>
                  <RatingStars rating={movie.rating} onChange={r => onUpdate(movie.id, { rating: r })} size="md" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Notes personnelles</Label>
              <Textarea
                value={editing ? (form.notes || '') : movie.notes}
                onChange={e => editing ? updateField('notes', e.target.value) : onUpdate(movie.id, { notes: e.target.value })}
                placeholder="Ajouter des notes..."
                className="resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>

        {editing && (
          <div className="border-t bg-background px-6 py-3 flex justify-end gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={cancelEdit}>Annuler</Button>
            <Button size="sm" className="gap-1" onClick={saveEdit}><Check size={14} /> Enregistrer</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
