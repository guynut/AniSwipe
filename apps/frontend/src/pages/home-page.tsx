import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SwipeCard } from "@/components/swipe-card";
import { AnimeDetailModal } from "@/components/anime-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAnimeStore } from "@/store/animeStore";
import type { Anime } from "@/types/anime";

export const HomePage = () => {
  const {
    cards,
    seasonal,
    trending,
    loadInitial,
    loadMore,
    registerSwipe,
    selectedAnime,
    setSelectedAnime,
    loading,
    error,
  } = useAnimeStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingMoreFromEmpty, setLoadingMoreFromEmpty] = useState(false);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (cards.length - currentIndex <= 4 && cards.length > 0) {
      void loadMore();
    }
  }, [cards.length, currentIndex, loadMore]);

  const visibleCards = useMemo(
    () => cards.slice(currentIndex, currentIndex + 4).reverse(),
    [cards, currentIndex]
  );

  const handleSwipe = async (direction: "left" | "right", anime: Anime) => {
    const action = direction === "right" ? "like" : "dislike";
    setCurrentIndex((index) => index + 1);

    try {
      await registerSwipe(anime, action);
      toast.success(action === "like" ? "Added to watchlist" : "Skipped anime");
    } catch (swipeError) {
      toast.error(swipeError instanceof Error ? swipeError.message : "Swipe failed");
    }
  };

  const swipedCount = currentIndex;
  const topCard = visibleCards[visibleCards.length - 1] ?? null;

  const handleLoadMoreFromEmpty = async () => {
    setLoadingMoreFromEmpty(true);
    try {
      await loadMore();
    } finally {
      setLoadingMoreFromEmpty(false);
    }
  };

  return (
    <section className="space-y-6 overflow-x-hidden">
      <div className="rounded-3xl border border-border bg-card/70 p-5 backdrop-blur sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
              AniSwipe Discovery
            </p>
            <h1 className="text-2xl font-bold sm:text-3xl">Find your next favorite anime</h1>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Swipe right to save, left to pass. Recommendations evolve based on what you love.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-right">
              <p className="text-xs text-white/60">Swiped</p>
              <p className="text-lg font-bold text-white">{swipedCount}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 px-4 py-3 text-right">
              <p className="text-xs text-white/60">Remaining</p>
              <p className="text-lg font-bold text-white">
                {Math.max(0, cards.length - currentIndex)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(320px,460px)_1fr]">
        <div className="space-y-4">
          <div className="mx-auto w-full max-w-[22rem] rounded-3xl border border-border bg-card/8 p-4 shadow-glow sm:max-w-none">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Swipe Deck</h2>
              <Badge className="bg-muted/60 text-white/80">
                {visibleCards.length > 0 ? "Live" : "Empty"}
              </Badge>
            </div>

            {loading && cards.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-[420px] w-full rounded-2xl sm:h-[520px]" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
                {error}
              </div>
            ) : (
              <div className="relative h-[420px] w-full overflow-hidden sm:h-[520px]">
                {visibleCards.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 text-center text-sm text-white/70">
                    <p className="mb-3 text-base font-medium">No more cards right now.</p>
                    <p className="mb-4 text-sm text-white/70">Try refreshing or loading more.</p>
                    {loadingMoreFromEmpty ? (
                      <div className="w-full space-y-2">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                      </div>
                    ) : null}

                    {!loadingMoreFromEmpty && (
                      <div className="flex w-full max-w-xs gap-3">
                        <button
                          className="w-1/2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-sm"
                          onClick={() => {
                            void loadInitial();
                            setCurrentIndex(0);
                          }}
                          disabled={loadingMoreFromEmpty}
                        >
                          Refresh
                        </button>
                        <button
                          className="w-1/2 rounded-lg bg-primary px-3 py-2 text-sm text-white"
                          onClick={() => {
                            void handleLoadMoreFromEmpty();
                          }}
                          disabled={loadingMoreFromEmpty}
                        >
                          {loadingMoreFromEmpty ? "Loading..." : "Load more"}
                        </button>
                      </div>
                    )}
                    <button
                      className="mt-3 text-xs underline text-white/80"
                      onClick={() => {
                        // show recommendations as a fallback
                        window.location.href = "/recommendations";
                      }}
                    >
                      View recommendations
                    </button>
                  </div>
                ) : (
                  visibleCards.map((anime) => (
                    <SwipeCard
                      key={`${anime.id}-${anime.malId}`}
                      anime={anime}
                      onSwipe={handleSwipe}
                      onOpenDetails={(selected) => setSelectedAnime(selected)}
                    />
                  ))
                )}
              </div>
            )}

            {topCard ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => void handleSwipe("left", topCard)}>
                  Nope
                </Button>
                <Button onClick={() => void handleSwipe("right", topCard)}>Like</Button>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-card/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
              Quick Controls
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/80">
              <Badge className="border-success/40 bg-success/10 text-success">
                Swipe right = Like
              </Badge>
              <Badge className="border-danger/40 bg-danger/10 text-danger">Swipe left = Skip</Badge>
              <Badge className="bg-muted/60 text-white/80">Tap card for details</Badge>
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[22rem] min-w-0 gap-6 sm:max-w-none md:grid-cols-2">
          <div className="min-w-0 rounded-3xl border border-border bg-card/80 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Seasonal Picks</h2>
              <Badge className="bg-secondary/20 text-secondary">Now Airing</Badge>
            </div>
            <ul className="space-y-2">
              {seasonal.slice(0, 7).map((anime) => (
                <li key={anime.id}>
                  <button
                    type="button"
                    className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 text-left transition hover:border-secondary/40 hover:bg-muted/50"
                    onClick={() => setSelectedAnime(anime)}
                  >
                    <img
                      src={anime.image}
                      alt={anime.title}
                      className="h-11 w-8 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{anime.title}</p>
                      <p className="text-xs text-white/60">Score {anime.score ?? "N/A"}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0 rounded-3xl border border-border bg-card/80 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Trending Now</h2>
              <Badge className="bg-primary/20 text-primary">Top Popular</Badge>
            </div>
            <ul className="space-y-2">
              {trending.slice(0, 7).map((anime) => (
                <li key={anime.id}>
                  <button
                    type="button"
                    className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 text-left transition hover:border-primary/40 hover:bg-muted/50"
                    onClick={() => setSelectedAnime(anime)}
                  >
                    <img
                      src={anime.image}
                      alt={anime.title}
                      className="h-11 w-8 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{anime.title}</p>
                      <p className="text-xs text-white/60">Popularity #{anime.popularity ?? "-"}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <AnimeDetailModal
        anime={selectedAnime}
        open={Boolean(selectedAnime)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAnime(null);
          }
        }}
      />
    </section>
  );
};
