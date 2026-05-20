import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { AnimeDetailModal } from "@/components/anime-detail-modal";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Anime, WatchlistItem } from "@/types/anime";

type VoiceActor = {
  malId: number;
  name: string;
  image?: string;
  language: string;
  characterName?: string;
  characterRole?: string;
};

type AnimeWithActors = {
  anime: Anime;
  actors: VoiceActor[];
};

type VoiceActorDetail = {
  malId: number;
  name: string;
  image?: string;
  language: string;
  animeCount: number;
  roles: Array<{
    animeId: string;
    animeTitle: string;
    characterName?: string;
    characterRole?: string;
  }>;
};

export const VoiceActorsPage = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AnimeWithActors[]>([]);
  const [selectedActorId, setSelectedActorId] = useState<number | null>(null);
  const [actorQuery, setActorQuery] = useState("");
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [selectedActorDetail, setSelectedActorDetail] = useState<VoiceActorDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const watchlist = await api.watchlist();

        const withActors = await Promise.all(
          watchlist.map(async (item: WatchlistItem) => {
            const actors = await api.voiceActorsByMalId(item.anime.malId);
            return {
              anime: item.anime,
              actors,
            };
          })
        );

        setRows(withActors);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load voice actors");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const actorGroups = useMemo(() => {
    const map = new Map<number, { actor: VoiceActor; animeIds: Set<string> }>();

    rows.forEach((row) => {
      row.actors.forEach((actor) => {
        if (!map.has(actor.malId)) {
          map.set(actor.malId, { actor, animeIds: new Set() });
        }
        map.get(actor.malId)?.animeIds.add(row.anime.id);
      });
    });

    return Array.from(map.values())
      .map((entry) => ({ ...entry.actor, animeCount: entry.animeIds.size }))
      .sort((a, b) => b.animeCount - a.animeCount);
  }, [rows]);

  const actorDetails = useMemo(() => {
    const map = new Map<number, VoiceActorDetail>();

    rows.forEach((row) => {
      row.actors.forEach((actor) => {
        if (!map.has(actor.malId)) {
          map.set(actor.malId, {
            malId: actor.malId,
            name: actor.name,
            image: actor.image,
            language: actor.language,
            animeCount: 0,
            roles: [],
          });
        }

        const detail = map.get(actor.malId);
        if (!detail) {
          return;
        }

        if (!detail.roles.some((role) => role.animeId === row.anime.id)) {
          detail.roles.push({
            animeId: row.anime.id,
            animeTitle: row.anime.title,
            characterName: actor.characterName,
            characterRole: actor.characterRole,
          });
          detail.animeCount += 1;
        }
      });
    });

    return map;
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!selectedActorId) {
      return rows;
    }
    return rows.filter((row) => row.actors.some((actor) => actor.malId === selectedActorId));
  }, [rows, selectedActorId]);

  const selectedAnimeVoiceActors = useMemo(() => {
    if (!selectedAnime) {
      return [];
    }

    return rows.find((row) => row.anime.id === selectedAnime.id)?.actors ?? [];
  }, [rows, selectedAnime]);

  const visibleActors = useMemo(() => {
    const query = actorQuery.trim().toLowerCase();
    if (!query) {
      // Default view: top 10 voice actors from watchlist
      return actorGroups.slice(0, 10);
    }

    return actorGroups.filter((actor) => actor.name.toLowerCase().includes(query)).slice(0, 20);
  }, [actorGroups, actorQuery]);

  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-border bg-card/70 p-5 backdrop-blur sm:p-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
          Voice Actors
        </p>
        <h1 className="text-2xl font-bold sm:text-3xl">Filter Anime by Voice Actor</h1>
        <p className="mt-2 text-sm text-white/70">
          Browse your watchlist by Japanese voice cast (JP only) and open anime details quickly.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`va-skeleton-${String(index)}`}
              className="h-72 animate-pulse rounded-2xl border border-border bg-card/70"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Voice Actor Filters</h2>
              <Badge>{actorGroups.length} actors</Badge>
            </div>
            <div className="mb-3 space-y-2">
              <input
                type="text"
                value={actorQuery}
                onChange={(event) => setActorQuery(event.target.value)}
                placeholder="Search voice actor..."
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-white outline-none transition focus:border-primary"
              />
              <p className="text-xs text-white/60">
                {actorQuery.trim()
                  ? `Showing matches for "${actorQuery.trim()}"`
                  : "Showing top 10 voice actors in your watchlist"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`rounded-full border px-3 py-1 text-xs ${
                  selectedActorId === null
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-card text-white/90"
                }`}
                onClick={() => setSelectedActorId(null)}
              >
                All
              </button>
              {visibleActors.map((actor) => (
                <button
                  key={actor.malId}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs ${
                    selectedActorId === actor.malId
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border bg-card text-white/90"
                  }`}
                  onClick={() => {
                    setSelectedActorId(actor.malId);
                    setSelectedActorDetail(actorDetails.get(actor.malId) ?? null);
                  }}
                >
                  {actor.name} ({actor.animeCount})
                </button>
              ))}
            </div>
            {actorQuery.trim() && visibleActors.length === 0 ? (
              <p className="mt-3 text-xs text-white/60">No voice actor found.</p>
            ) : null}
          </div>

          {filteredRows.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card/70 p-8 text-center">
              <p className="text-base font-medium">No anime found for this voice actor</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRows.map((row) => (
                <article
                  key={row.anime.id}
                  className="cursor-pointer overflow-hidden rounded-2xl border border-border bg-card/80 transition hover:border-primary/50 hover:shadow-glow"
                  onClick={() => setSelectedAnime(row.anime)}
                >
                  <img
                    src={row.anime.image}
                    alt={row.anime.title}
                    className="h-56 w-full object-cover"
                  />
                  <div className="space-y-3 p-4">
                    <h3 className="line-clamp-1 font-semibold">{row.anime.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      {row.actors.slice(0, 4).map((actor) => (
                        <Badge key={`${row.anime.id}-${actor.malId}`}>{actor.name}</Badge>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <AnimeDetailModal
        anime={selectedAnime}
        open={Boolean(selectedAnime)}
        detailMode="voice-actors"
        voiceActors={selectedAnimeVoiceActors}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAnime(null);
          }
        }}
      />

      <Dialog
        open={Boolean(selectedActorDetail)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedActorDetail(null);
          }
        }}
      >
        <DialogContent className="w-[min(96vw,760px)]">
          {!selectedActorDetail ? null : (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {selectedActorDetail.image ? (
                  <img
                    src={selectedActorDetail.image}
                    alt={selectedActorDetail.name}
                    className="h-24 w-20 rounded-lg object-cover"
                  />
                ) : null}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold">{selectedActorDetail.name}</h2>
                  <p className="text-sm text-white/70">Language: {selectedActorDetail.language}</p>
                  <div className="mt-2">
                    <Badge>{selectedActorDetail.animeCount} anime in your watchlist</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">Roles in your watchlist</h3>
                <div className="space-y-2">
                  {selectedActorDetail.roles.map((role) => (
                    <button
                      key={`${selectedActorDetail.malId}-${role.animeId}`}
                      type="button"
                      className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2 text-left transition hover:border-primary/50"
                      onClick={() => {
                        const match = rows.find((row) => row.anime.id === role.animeId)?.anime;
                        if (match) {
                          setSelectedAnime(match);
                        }
                      }}
                    >
                      <p className="text-sm font-medium">{role.animeTitle}</p>
                      <p className="text-xs text-white/65">
                        {role.characterName
                          ? `Character: ${role.characterName}${role.characterRole ? ` (${role.characterRole})` : ""}`
                          : "Character info unavailable"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};
