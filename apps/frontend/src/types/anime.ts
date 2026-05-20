export type Anime = {
  id: string;
  malId: number;
  title: string;
  image: string;
  genres: string[];
  score: number | null;
  episodes: number | null;
  synopsis: string | null;
  popularity: number | null;
};

export type WatchlistItem = {
  id: string;
  animeId: string;
  createdAt: string;
  anime: Anime;
};

export type Recommendation = Anime & {
  recommendationScore: number;
};
