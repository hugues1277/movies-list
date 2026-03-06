const API_KEY = '7123ba2c';
const BASE_URL = 'https://www.omdbapi.com';

export interface OmdbSearchResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OmdbSearchResponse {
  Search?: OmdbSearchResult[];
  totalResults?: string;
  Response: string;
  Error?: string;
}

export interface OmdbMovieDetail {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Poster: string;
  imdbRating: string;
  imdbID: string;
  Type: string;
  Response: string;
}

export async function searchOmdb(query: string, type?: string, page = 1): Promise<OmdbSearchResponse> {
  let url = `${BASE_URL}/?apikey=${API_KEY}&s=${encodeURIComponent(query)}&page=${page}`;
  if (type) url += `&type=${type}`;
  const res = await fetch(url);
  return res.json();
}

export async function getOmdbDetails(imdbId: string): Promise<OmdbMovieDetail> {
  const res = await fetch(`${BASE_URL}/?apikey=${API_KEY}&i=${imdbId}&plot=full`);
  return res.json();
}

export async function getOmdbByTitle(title: string, year?: string): Promise<OmdbMovieDetail> {
  let url = `${BASE_URL}/?apikey=${API_KEY}&t=${encodeURIComponent(title)}&plot=full`;
  if (year) url += `&y=${encodeURIComponent(year)}`;
  const res = await fetch(url);
  return res.json();
}

export function getYoutubeTrailerUrl(title: string, year: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${title} ${year} bande annonce officielle`)}`;
}
