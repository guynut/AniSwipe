export type AnimeForRecommendation = {
  id: string;
  title: string;
  score: number | null;
  popularity: number | null;
  genres: string[];
};

export type RecommendationResult = AnimeForRecommendation & {
  recommendationScore: number;
};

export const rankRecommendations = (
  animeList: AnimeForRecommendation[],
  likedGenreFrequency: Record<string, number>
): RecommendationResult[] => {
  return animeList
    .map((anime) => {
      const genreWeight = anime.genres.reduce(
        (total, genre) => total + (likedGenreFrequency[genre] ?? 0),
        0
      );
      const scoreWeight = anime.score ?? 0;
      const popularityWeight = anime.popularity ? Math.max(0, 10000 - anime.popularity) / 1000 : 0;

      const recommendationScore = Number(
        (genreWeight * 2 + scoreWeight + popularityWeight).toFixed(2)
      );

      return {
        ...anime,
        recommendationScore,
      };
    })
    .sort((a, b) => b.recommendationScore - a.recommendationScore);
};
