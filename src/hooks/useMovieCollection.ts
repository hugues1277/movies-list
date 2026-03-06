import { useState, useCallback, useEffect, useRef } from 'react';
import { Movie, Filters, SortField, SortOrder } from '@/types/movie';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'movies';
const CACHE_KEY = 'cinetrack_movies_cache';
const CACHE_TS_KEY = 'cinetrack_movies_cache_ts';
const CACHE_MAX_AGE = 1000 * 60 * 60 * 24; // 24h

function readCache(): Movie[] | null {
  try {
    const ts = localStorage.getItem(CACHE_TS_KEY);
    if (ts && Date.now() - Number(ts) > CACHE_MAX_AGE) {
      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_TS_KEY);
      return null;
    }
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(movies: Movie[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(movies));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch { /* quota exceeded — ignore */ }
}

export function useMovieCollection() {
  const cached = useRef(readCache());
  const [movies, setMovies] = useState<Movie[]>(cached.current ?? []);
  const [loading, setLoading] = useState(!cached.current);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
      const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Movie));
      setMovies(data);
      writeCache(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const addMovie = useCallback(async (movie: Movie) => {
    await setDoc(doc(db, COLLECTION_NAME, movie.id), movie);
  }, []);

  const updateMovie = useCallback(async (id: string, updates: Partial<Movie>) => {
    await updateDoc(doc(db, COLLECTION_NAME, id), updates);
  }, []);

  const removeMovie = useCallback(async (id: string) => {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  }, []);

  return { movies, loading, addMovie, updateMovie, removeMovie };
}

export function filterAndSortMovies(
  movies: Movie[],
  filters: Filters,
  sortField: SortField,
  sortOrder: SortOrder
): Movie[] {
  let filtered = [...movies];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.year.includes(q) ||
      m.actors?.toLowerCase().includes(q)
    );
  }

  if (filters.genre) filtered = filtered.filter(m => m.genre.toLowerCase().includes(filters.genre.toLowerCase()));
  
  if (filters.type) filtered = filtered.filter(m => m.type === filters.type);
  if (filters.watched === 'yes') filtered = filtered.filter(m => m.watched);
  if (filters.watched === 'no') filtered = filtered.filter(m => !m.watched);
  if (filters.favorite === 'yes') filtered = filtered.filter(m => m.favorite);
  if (filters.inMyList === 'yes') filtered = filtered.filter(m => m.inMyList);
  if (filters.rated) {
    const exactRating = parseInt(filters.rated);
    if (!isNaN(exactRating)) filtered = filtered.filter(m => m.rating === exactRating);
  }

  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortField === 'year') cmp = a.year.localeCompare(b.year);
    else if (sortField === 'rating') cmp = a.rating - b.rating;
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  return filtered;
}
