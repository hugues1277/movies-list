export interface Movie {
  id: string;
  title: string;
  year: string;
  poster: string;
  genre: string;
  director: string;
  actors: string;
  plot: string;
  rated: string;
  runtime: string;
  type: 'movie' | 'series' | 'episode';
  imdbRating: string;
  rating: number;
  notes: string;
  watched: boolean;
  
  favorite: boolean;
  inMyList: boolean;
  addedAt: string;
  updatedAt?: string;
}

export type SortField = 'title' | 'year' | 'rating';
export type SortOrder = 'asc' | 'desc';

export interface Filters {
  search: string;
  genre: string;
  type: string;
  watched: string;
  
  favorite: string;
  inMyList: string;
  rated: string;
}
