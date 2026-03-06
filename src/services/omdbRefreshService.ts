import { getOmdbDetails } from '@/lib/omdb';
import { Movie } from '@/types/movie';

const REFRESHABLE_FIELDS = [
  'title', 'year', 'poster', 'genre', 'director', 'actors',
  'plot', 'rated', 'runtime', 'type', 'imdbRating',
] as const;

/** Refresh a single movie from OMDb. Returns partial update or throws. */
export async function refreshSingleMovieFromOmdb(imdbId: string): Promise<Partial<Movie>> {
  const d = await getOmdbDetails(imdbId);
  if (d.Response === 'False') throw new Error('Not found on OMDb');
  return {
    title: d.Title, year: d.Year, poster: d.Poster, genre: d.Genre,
    director: d.Director, actors: d.Actors, plot: d.Plot,
    rated: d.Rated, runtime: d.Runtime, type: d.Type as Movie['type'],
    imdbRating: d.imdbRating, updatedAt: new Date().toISOString(),
  };
}

export interface RefreshResult {
  id: string;
  title: string;
  success: boolean;
  error?: string;
}

/**
 * Refreshes a list of movies from OMDb based on their IMDB ID.
 * Returns updated partial data for each movie (caller must persist).
 */
export async function refreshMoviesFromOmdb(
  movies: Movie[],
  onProgress?: (done: number, total: number) => void,
): Promise<{ updates: { id: string; data: Partial<Movie> }[]; results: RefreshResult[] }> {
  const imdbMovies = movies.filter(m => m.id && !m.id.startsWith('manual-'));
  const updates: { id: string; data: Partial<Movie> }[] = [];
  const results: RefreshResult[] = [];

  for (let i = 0; i < imdbMovies.length; i++) {
    const movie = imdbMovies[i];
    try {
      const d = await getOmdbDetails(movie.id);
      if (d.Response === 'False') {
        results.push({ id: movie.id, title: movie.title, success: false, error: 'Not found on OMDb' });
        continue;
      }

      const data: Partial<Movie> = {
        title: d.Title,
        year: d.Year,
        poster: d.Poster,
        genre: d.Genre,
        director: d.Director,
        actors: d.Actors,
        plot: d.Plot,
        rated: d.Rated,
        runtime: d.Runtime,
        type: d.Type as Movie['type'],
        imdbRating: d.imdbRating,
        updatedAt: new Date().toISOString(),
      };

      updates.push({ id: movie.id, data });
      results.push({ id: movie.id, title: d.Title, success: true });
    } catch (err) {
      results.push({ id: movie.id, title: movie.title, success: false, error: String(err) });
    }
    onProgress?.(i + 1, imdbMovies.length);
  }

  return { updates, results };
}
