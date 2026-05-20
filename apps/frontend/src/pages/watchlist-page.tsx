import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AnimeDetailModal } from "@/components/anime-detail-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Anime, WatchlistItem } from "@/types/anime";

type StreamingItem = {
  name: string;
  url?: string;
};

export const WatchlistPage = () => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [streamingLoading, setStreamingLoading] = useState(false);
  const [streamingGroups, setStreamingGroups] = useState<
    Array<{ provider: string; anime: Array<{ id: string; title: string }> }>
  >([]);
  const [expandedProviders, setExpandedProviders] = useState<Record<string, boolean>>({});

  const toggleProvider = (provider: string) => {
    setExpandedProviders((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const result = await api.watchlist();
      setItems(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch watchlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWatchlist();
  }, []);

  useEffect(() => {
    const buildStreamingGroups = async () => {
      if (items.length === 0) {
        setStreamingGroups([]);
        return;
      }

      setStreamingLoading(true);
      try {
        const providerMap = new Map<string, Map<string, { id: string; title: string }>>();

        const results = await Promise.allSettled(
          items.map(async (item) => {
            const streaming = await api.streamingByMalId(item.anime.malId);
            return { item, streaming };
          })
        );

        results.forEach((result) => {
          if (result.status !== "fulfilled") return;
          const { item, streaming } = result.value;

          streaming.forEach((provider: StreamingItem) => {
            const providerName = provider.name?.trim();
            if (!providerName) return;

            if (!providerMap.has(providerName)) {
              providerMap.set(providerName, new Map());
            }

            const animeById = providerMap.get(providerName);
            if (!animeById) return;

            animeById.set(item.anime.id, {
              id: item.anime.id,
              title: item.anime.title,
            });
          });
        });

        const groups = Array.from(providerMap.entries())
          .map(([provider, animeById]) => ({
            provider,
            anime: Array.from(animeById.values()),
          }))
          .sort((a, b) => b.anime.length - a.anime.length);

        setStreamingGroups(groups);
      } finally {
        setStreamingLoading(false);
      }
    };

    void buildStreamingGroups();
  }, [items]);

  const removeItem = async (animeId: string) => {
    try {
      await api.removeWatchlist(animeId);
      toast.success("Removed from watchlist");
      await loadWatchlist();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Remove failed");
    }
  };

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-border bg-card/70 p-5 backdrop-blur sm:p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
          Saved Picks
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Your Watchlist</h1>
            <p className="mt-2 text-sm text-white/70">
              Everything you liked from the swipe deck, ready for your next binge.
            </p>
          </div>
          <Badge className="bg-primary/20 text-primary">{items.length} saved</Badge>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`watchlist-skeleton-${String(index)}`}
              className="h-80 animate-pulse rounded-2xl border border-border bg-card/70"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/70 p-8 text-center">
          <p className="text-base font-medium">No anime liked yet</p>
          <p className="mt-2 text-sm text-white/70">
            Start swiping on the home page and your likes will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Streaming Breakdown</h2>
              <Badge className="bg-secondary/20 text-secondary">
                {streamingGroups.length} platforms
              </Badge>
            </div>

            {streamingLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`streaming-skeleton-${String(index)}`}
                    className="h-14 animate-pulse rounded-xl border border-border bg-muted/40"
                  />
                ))}
              </div>
            ) : streamingGroups.length === 0 ? (
              <p className="text-sm text-white/70">
                No streaming data available for your current watchlist.
              </p>
            ) : (
              <div className="space-y-3">
                {streamingGroups.map((group) => {
                  const isOpen = Boolean(expandedProviders[group.provider]);
                  return (
                    <div
                      key={group.provider}
                      className="rounded-xl border border-border bg-muted/30"
                    >
                      <button
                        type="button"
                        className="w-full px-3 py-2 flex items-center justify-between"
                        onClick={() => toggleProvider(group.provider)}
                      >
                        <div className="flex items-center gap-3">
                          <p className="font-medium">{group.provider}</p>
                          <Badge>{group.anime.length} anime</Badge>
                        </div>
                        <span className="text-xs text-white/60">{isOpen ? "▾" : "▸"}</span>
                      </button>
                      {isOpen ? (
                        <div className="p-3 pt-0">
                          <div className="flex flex-wrap gap-2">
                            {group.anime.map((anime) => (
                              <button
                                key={`${group.provider}-${anime.id}`}
                                type="button"
                                className="rounded-full border border-border bg-card px-3 py-1 text-xs text-white/90 transition hover:border-primary/60 hover:text-white"
                                onClick={() => {
                                  const match = items.find(
                                    (item) => item.anime.id === anime.id
                                  )?.anime;
                                  if (match) {
                                    setSelectedAnime(match);
                                  }
                                }}
                              >
                                {anime.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card/80 transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-glow"
                onClick={() => setSelectedAnime(item.anime)}
              >
                <div className="relative">
                  <img
                    src={item.anime.image}
                    alt={item.anime.title}
                    className="h-64 w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10">
                    <p className="text-xs text-white/75">Score {item.anime.score ?? "N/A"}</p>
                    <h2 className="line-clamp-1 font-semibold">{item.anime.title}</h2>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap gap-2">
                    {item.anime.genres.slice(0, 3).map((genre) => (
                      <Badge key={genre}>{genre}</Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(event) => {
                      event.stopPropagation();
                      void removeItem(item.animeId);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

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
