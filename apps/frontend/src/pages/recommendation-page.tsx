import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AnimeDetailModal } from "@/components/anime-detail-modal";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import type { Anime, Recommendation } from "@/types/anime";

export const RecommendationPage = () => {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  const handleAddedToWatchlist = () => {
    if (!selectedAnime) {
      return;
    }
    // Remove the newly saved anime from current recommendation list.
    setItems((previous) => previous.filter((item) => item.id !== selectedAnime.id));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.recommendations();
        setItems(data);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load recommendations");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-border bg-card/70 p-5 backdrop-blur sm:p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
          Personalized Picks
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">Recommended for You</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/70">
          Ranked by your liked genres, anime scores, and popularity to surface strong matches first.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`recommendation-skeleton-${String(index)}`}
              className="h-44 animate-pulse rounded-2xl border border-border bg-card/70"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/70 p-8 text-center">
          <p className="text-base font-medium">No recommendations yet</p>
          <p className="mt-2 text-sm text-white/70">
            Swipe and like a few anime first to unlock recommendations.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((anime) => (
            <article
              key={anime.id}
              className="cursor-pointer rounded-2xl border border-border bg-card/80 p-4 transition hover:border-secondary/40 hover:bg-card"
              onClick={() => setSelectedAnime(anime)}
            >
              <div className="flex gap-4">
                <img
                  src={anime.image}
                  alt={anime.title}
                  className="h-32 w-24 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <h2 className="line-clamp-1 font-semibold">{anime.title}</h2>
                  <div className="flex items-center justify-between text-xs text-white/75">
                    <span>Score {anime.score ?? "N/A"}</span>
                    <span>Episodes {anime.episodes ?? "?"}</span>
                  </div>
                  <Badge className="w-fit bg-success/20 text-success">
                    Match {Math.min(99, Math.round(anime.recommendationScore * 6))}%
                  </Badge>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
                      style={{
                        width: `${Math.min(99, Math.round(anime.recommendationScore * 6))}%`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {anime.genres.slice(0, 3).map((genre) => (
                      <Badge key={genre}>{genre}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AnimeDetailModal
        anime={selectedAnime}
        open={Boolean(selectedAnime)}
        showAddToWatchlist
        onAddedToWatchlist={handleAddedToWatchlist}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAnime(null);
          }
        }}
      />
    </section>
  );
};
