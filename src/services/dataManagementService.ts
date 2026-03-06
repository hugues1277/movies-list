import Papa from 'papaparse';
import { Movie } from '@/types/movie';

const EXPORT_FIELDS: (keyof Movie)[] = [
  'id', 'title', 'year', 'poster', 'genre', 'director', 'actors',
  'plot', 'rated', 'runtime', 'type', 'imdbRating',
  'rating', 'notes', 'watched', 'favorite', 'inMyList', 'addedAt', 'updatedAt'
];

export function exportMoviesToCsv(movies: Movie[]): void {
  const csv = Papa.unparse(movies, { columns: EXPORT_FIELDS });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cinetrack-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importMoviesFromCsv(file: File): Promise<Movie[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const movies: Movie[] = results.data.map(row => ({
          id: row.id || crypto.randomUUID(),
          title: row.title || '',
          year: row.year || '',
          poster: row.poster || '',
          genre: row.genre || '',
          director: row.director || '',
          actors: row.actors || '',
          plot: row.plot || '',
          rated: row.rated || '',
          runtime: row.runtime || '',
          type: (row.type as Movie['type']) || 'movie',
          imdbRating: row.imdbRating || '',
          rating: Number(row.rating) || 0,
          notes: row.notes || '',
          watched: row.watched === 'true',
          favorite: row.favorite === 'true',
          inMyList: row.inMyList === 'true',
          addedAt: row.addedAt || new Date().toISOString(),
        }));
        resolve(movies);
      },
      error(err) {
        reject(err);
      },
    });
  });
}
