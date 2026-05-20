import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import type { Anime } from "@/types/anime";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type AnimeDetailModalProps = {
  anime: Anime | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showAddToWatchlist?: boolean;
  onAddedToWatchlist?: () => void;
  detailMode?: "default" | "voice-actors";
  voiceActors?: Array<{
    malId: number;
    name: string;
    language?: string;
    characterName?: string;
    characterRole?: string;
  }>;
};

type StreamingItem = { name: string; url?: string };
type VideoItem = { site: string; url: string; title?: string; type?: string };

export const AnimeDetailModal = ({
  anime,
  open,
  onOpenChange,
  showAddToWatchlist = false,
  onAddedToWatchlist,
  detailMode = "default",
  voiceActors = [],
}: AnimeDetailModalProps) => {
  const [streaming, setStreaming] = useState<StreamingItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loadingStreaming, setLoadingStreaming] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadVideos = async () => {
      if (!anime) {
        setVideos([]);
        return;
      }
      setLoadingVideos(true);
      try {
        const data = await api.videosByMalId(anime.malId);
        if (mounted && Array.isArray(data)) {
          setVideos(data);
        }
      } catch {
        if (mounted) setVideos([]);
      } finally {
        if (mounted) setLoadingVideos(false);
      }
    };

    const load = async () => {
      if (!anime) {
        setStreaming([]);
        return;
      }
      setLoadingStreaming(true);
      try {
        const data = await api.streamingByMalId(anime.malId);
        if (mounted && Array.isArray(data)) {
          setStreaming(data);
        }
      } catch {
        if (mounted) setStreaming([]);
      } finally {
        if (mounted) setLoadingStreaming(false);
      }
    };

    if (open) {
      void load();
      void loadVideos();
    }
    return () => {
      mounted = false;
    };
  }, [anime, open]);

  const firstYoutube = videos.find(
    (video) => video.url.includes("youtube") || video.url.includes("youtu.be")
  );

  const toEmbedUrl = (url: string) => {
    if (url.includes("watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    return url;
  };

  const handleAddToWatchlist = async () => {
    if (!anime) {
      return;
    }

    setAddingToWatchlist(true);
    try {
      await api.addWatchlist(anime.id);
      toast.success("Added to watchlist");
      onAddedToWatchlist?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add watchlist");
    } finally {
      setAddingToWatchlist(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[min(96vw,1080px)] overflow-y-auto overflow-x-hidden">
        {!anime ? null : (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div>
                <img
                  src={anime.image}
                  alt={anime.title}
                  className="h-80 w-full rounded-xl object-cover lg:h-[420px]"
                />
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl font-bold">{anime.title}</h2>
                <p className="mt-2 text-sm text-white/80">Score: {anime.score ?? "N/A"}</p>
                <p className="text-sm text-white/80">Episodes: {anime.episodes ?? "Unknown"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {anime.genres.map((genre) => (
                    <Badge key={genre}>{genre}</Badge>
                  ))}
                </div>

                {detailMode === "voice-actors" ? (
                  <div className="mt-3">
                    <h3 className="mb-2 text-sm font-semibold">Voice Actors</h3>
                    {voiceActors.length === 0 ? (
                      <p className="text-sm text-white/60">No voice actor data available.</p>
                    ) : (
                      <div className="space-y-2">
                        {voiceActors.map((actor) => (
                          <div
                            key={`${String(actor.malId)}-${actor.name}-${actor.characterName ?? ""}`}
                            className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2"
                          >
                            <p className="text-sm font-medium">{actor.name}</p>
                            <p className="text-xs text-white/65">
                              {actor.characterName
                                ? `Character: ${actor.characterName}${
                                    actor.characterRole ? ` (${actor.characterRole})` : ""
                                  }`
                                : "Character info unavailable"}
                              {actor.language ? ` • ${actor.language}` : ""}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <h3 className="mb-2 text-sm font-semibold">Streaming</h3>
                    {loadingStreaming ? (
                      <p className="text-sm text-white/60">Loading...</p>
                    ) : streaming.length === 0 ? (
                      <p className="text-sm text-white/60">No streaming info available.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {streaming.map((s) => (
                          <a key={s.name} href={s.url ?? "#"} target="_blank" rel="noreferrer">
                            <Badge>{s.name}</Badge>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {showAddToWatchlist ? (
                  <div className="mt-3">
                    <Button
                      type="button"
                      onClick={() => void handleAddToWatchlist()}
                      disabled={addingToWatchlist}
                    >
                      {addingToWatchlist ? "Adding..." : "Add to Watchlist"}
                    </Button>
                  </div>
                ) : null}

                <p className="mt-4 max-h-52 overflow-auto text-sm text-white/90">
                  {anime.synopsis ?? "Synopsis unavailable."}
                </p>
              </div>
            </div>

            {detailMode === "voice-actors" ? null : (
              <div className="min-w-0 rounded-xl border border-border/70 bg-muted/20 p-3">
                <h3 className="mb-2 text-sm font-semibold">Preview</h3>
                {firstYoutube ? (
                  <div className="space-y-3">
                    <div className="aspect-video w-full overflow-hidden rounded-md border border-border">
                      <iframe
                        title="promo"
                        src={toEmbedUrl(firstYoutube.url)}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                    <p className="line-clamp-2 text-xs text-white/70">
                      {firstYoutube.title || "Official promotional video"}
                    </p>
                  </div>
                ) : loadingVideos ? (
                  <p className="text-sm text-white/60">Loading preview...</p>
                ) : (
                  <p className="text-sm text-white/60">No preview video available.</p>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
