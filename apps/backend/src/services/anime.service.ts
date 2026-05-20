import type { Anime } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { rankRecommendations, type AnimeForRecommendation } from "../lib/recommendation";
import {
  fetchJikanAnime,
  fetchJikanAnimeCharacters,
  fetchJikanAnimeDetail,
  fetchJikanAnimeVideos,
  JikanApiError,
} from "./jikan.service";

type AnimeDTO = {
  malId: number;
  title: string;
  image: string;
  genres: string[];
  score: number | null;
  episodes: number | null;
  synopsis: string | null;
  popularity: number | null;
};

type StreamingItem = { name: string; url: string };
const STREAMING_CACHE_TTL_MS = 1000 * 60 * 60 * 24;

const normalizeAnime = (anime: {
  mal_id: number;
  title: string;
  images?: {
    jpg?: { image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; large_image_url?: string };
  };
  genres?: Array<{ name: string }>;
  score?: number;
  episodes?: number;
  synopsis?: string;
  popularity?: number;
}): AnimeDTO => ({
  malId: anime.mal_id,
  title: anime.title,
  image:
    anime.images?.webp?.large_image_url ??
    anime.images?.jpg?.large_image_url ??
    anime.images?.webp?.image_url ??
    anime.images?.jpg?.image_url ??
    "",
  genres: anime.genres?.map((genre) => genre.name) ?? [],
  score: anime.score ?? null,
  episodes: anime.episodes ?? null,
  synopsis: anime.synopsis ?? null,
  popularity: anime.popularity ?? null,
});

const encodeGenres = (genres: string[]) => JSON.stringify(genres);

const decodeGenres = (genres: string) => {
  try {
    return JSON.parse(genres) as string[];
  } catch {
    return [];
  }
};

const toAnimeResponse = (anime: Anime) => ({
  ...anime,
  genres: decodeGenres(anime.genres),
});

const upsertAnime = async (anime: AnimeDTO): Promise<Anime> => {
  return prisma.anime.upsert({
    where: { malId: anime.malId },
    create: {
      malId: anime.malId,
      title: anime.title,
      image: anime.image,
      genres: encodeGenres(anime.genres),
      score: anime.score,
      episodes: anime.episodes,
      synopsis: anime.synopsis,
      popularity: anime.popularity,
    },
    update: {
      title: anime.title,
      image: anime.image,
      genres: encodeGenres(anime.genres),
      score: anime.score,
      episodes: anime.episodes,
      synopsis: anime.synopsis,
      popularity: anime.popularity,
    },
  });
};

const getCachedDiscoverAnime = async (page: number, limit: number) => {
  const skip = Math.max(0, page - 1) * limit;
  const cached = await prisma.anime.findMany({
    skip,
    take: limit,
    orderBy: [{ score: "desc" }, { popularity: "asc" }, { createdAt: "desc" }],
  });
  return cached.map(toAnimeResponse);
};

const getSwipedAnimeIdSet = async (sessionId: string) => {
  const swipes = await prisma.swipe.findMany({
    where: {
      sessionId,
    },
    select: {
      animeId: true,
    },
  });

  return new Set(swipes.map((swipe) => swipe.animeId));
};

const getCachedTrendingAnime = async () => {
  const cached = await prisma.anime.findMany({
    take: 10,
    orderBy: [{ popularity: "asc" }, { score: "desc" }],
  });
  return cached.map(toAnimeResponse);
};

const getCachedSeasonalAnime = async () => {
  const cached = await prisma.anime.findMany({
    take: 10,
    orderBy: [{ createdAt: "desc" }, { score: "desc" }],
  });
  return cached.map(toAnimeResponse);
};

export const fetchAndCacheDiscoverAnime = async (
  page: number,
  limit: number,
  sessionId: string
) => {
  const swipedAnimeIds = await getSwipedAnimeIdSet(sessionId);

  try {
    const data = await fetchJikanAnime("/top/anime", {
      page,
      limit,
    });

    const normalized = data.map(normalizeAnime);
    const upserted = await Promise.all(normalized.map(upsertAnime));
    return upserted.map(toAnimeResponse).filter((anime) => !swipedAnimeIds.has(anime.id));
  } catch (error) {
    if (error instanceof JikanApiError && error.status === 429) {
      const cached = await getCachedDiscoverAnime(page, limit);
      const filteredCached = cached.filter((anime) => !swipedAnimeIds.has(anime.id));
      if (filteredCached.length > 0) {
        return filteredCached;
      }
    }
    throw error;
  }
};

export const fetchAndCacheTrendingAnime = async () => {
  try {
    const data = await fetchJikanAnime("/top/anime", {
      limit: 10,
      filter: "bypopularity",
    });

    const upserted = await Promise.all(data.map((item) => upsertAnime(normalizeAnime(item))));
    return upserted.map(toAnimeResponse);
  } catch (error) {
    if (error instanceof JikanApiError && error.status === 429) {
      const cached = await getCachedTrendingAnime();
      if (cached.length > 0) {
        return cached;
      }
    }
    throw error;
  }
};

export const fetchAndCacheSeasonalAnime = async () => {
  try {
    const data = await fetchJikanAnime("/seasons/now", {
      limit: 10,
    });

    const upserted = await Promise.all(data.map((item) => upsertAnime(normalizeAnime(item))));
    return upserted.map(toAnimeResponse);
  } catch (error) {
    if (error instanceof JikanApiError && error.status === 429) {
      const cached = await getCachedSeasonalAnime();
      if (cached.length > 0) {
        return cached;
      }
    }
    throw error;
  }
};

export const saveSwipe = async (animeId: string, action: "like" | "dislike", sessionId: string) => {
  return prisma.swipe.create({
    data: {
      sessionId,
      animeId,
      action,
    },
  });
};

export const addToWatchlist = async (animeId: string, sessionId: string) => {
  return prisma.watchlist.upsert({
    where: {
      sessionId_animeId: {
        sessionId,
        animeId,
      },
    },
    create: {
      sessionId,
      animeId,
    },
    update: {},
  });
};

export const removeFromWatchlist = async (animeId: string, sessionId: string) => {
  return prisma.watchlist.deleteMany({
    where: {
      sessionId,
      animeId,
    },
  });
};

export const getWatchlist = async (sessionId: string) => {
  const rows = await prisma.watchlist.findMany({
    where: {
      sessionId,
    },
    include: {
      anime: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return rows.map((row) => ({
    ...row,
    anime: toAnimeResponse(row.anime),
  }));
};

export const getRecommendations = async (limit: number, sessionId: string) => {
  const likedSwipes = await prisma.swipe.findMany({
    where: {
      sessionId,
      action: "like",
    },
    include: {
      anime: true,
    },
  });

  const likedGenreFrequency = likedSwipes.reduce<Record<string, number>>((acc, swipe) => {
    const genres = decodeGenres(swipe.anime.genres);
    genres.forEach((genre) => {
      acc[genre] = (acc[genre] ?? 0) + 1;
    });
    return acc;
  }, {});

  const likedAnimeIds = new Set(likedSwipes.map((swipe) => swipe.animeId));

  const candidates = await prisma.anime.findMany({
    where: {
      id: {
        notIn: [...likedAnimeIds],
      },
    },
    take: 200,
  });

  const normalizedCandidates: AnimeForRecommendation[] = candidates.map((anime) => ({
    id: anime.id,
    title: anime.title,
    score: anime.score,
    popularity: anime.popularity,
    genres: decodeGenres(anime.genres),
  }));

  const ranked = rankRecommendations(normalizedCandidates, likedGenreFrequency).slice(0, limit);

  return ranked
    .map((item) => {
      const fullAnime = candidates.find((anime) => anime.id === item.id);
      if (!fullAnime) {
        return null;
      }

      return {
        ...toAnimeResponse(fullAnime),
        recommendationScore: item.recommendationScore,
      };
    })
    .filter((anime): anime is NonNullable<typeof anime> => Boolean(anime));
};

export const getAnimeById = async (animeId: string) => {
  const anime = await prisma.anime.findUnique({
    where: {
      id: animeId,
    },
  });

  return anime ? toAnimeResponse(anime) : null;
};

const normalizeStreaming = (streaming: unknown) => {
  if (!Array.isArray(streaming)) {
    return [];
  }

  return streaming.map((item): StreamingItem => {
    if (typeof item === "string") {
      return { name: item, url: "" };
    }

    const record = item as Record<string, unknown>;
    return {
      name:
        (typeof record.name === "string" && record.name) ||
        (typeof record.title === "string" && record.title) ||
        "Stream",
      url:
        (typeof record.url === "string" && record.url) ||
        (typeof record.link === "string" && record.link) ||
        "",
    };
  });
};

const decodeStreaming = (streaming: string | null) => {
  if (!streaming) {
    return [];
  }

  try {
    const parsed = JSON.parse(streaming) as unknown;
    return normalizeStreaming(parsed);
  } catch {
    return [];
  }
};

const hasFreshStreamingCache = (updatedAt: Date | null) => {
  if (!updatedAt) {
    return false;
  }
  return Date.now() - updatedAt.getTime() < STREAMING_CACHE_TTL_MS;
};

export const getStreamingForMalId = async (malId: number) => {
  const cachedAnime = await prisma.anime.findUnique({
    where: { malId },
    select: {
      id: true,
      streaming: true,
      streamingUpdatedAt: true,
    },
  });

  if (cachedAnime && hasFreshStreamingCache(cachedAnime.streamingUpdatedAt)) {
    return decodeStreaming(cachedAnime.streaming);
  }

  try {
    const detail = await fetchJikanAnimeDetail(malId);
    const streaming =
      detail?.streaming ?? detail?.streaming_links ?? detail?.streamingEpisodes ?? [];
    const normalized = normalizeStreaming(streaming);

    if (cachedAnime?.id) {
      await prisma.anime.update({
        where: { id: cachedAnime.id },
        data: {
          streaming: JSON.stringify(normalized),
          streamingUpdatedAt: new Date(),
        },
      });
    }

    return normalized;
  } catch (error) {
    // Prefer stale cache over failing the request.
    if (cachedAnime?.streaming) {
      return decodeStreaming(cachedAnime.streaming);
    }

    // For Jikan API limitations (rate-limit/not-found/upstream), return empty list gracefully.
    if (
      error instanceof JikanApiError &&
      (error.status === 404 || error.status === 429 || error.status >= 500)
    ) {
      return [];
    }

    throw error;
  }
};

export const getVideosForMalId = async (malId: number) => {
  try {
    const data = await fetchJikanAnimeVideos(malId);
    // Prefer promo videos/trailers.
    const videos = (data?.promo ?? data?.videos ?? data) as any[];
    if (!Array.isArray(videos)) return [];
    return videos
      .map((v) => {
        // Jikan structure varies; many promos provide trailer.embed_url with null trailer.url.
        const trailer = v?.trailer ?? {};
        const url = v.url ?? v.video_url ?? v.embed_url ?? trailer.url ?? trailer.embed_url ?? "";
        const site = v.site ?? v.provider ?? (url.includes("youtube") ? "YouTube" : "Other");
        const title = v.title ?? v.name ?? trailer.title ?? "";
        const type = v.type ?? trailer.type ?? "promo";
        return { site, url, title, type };
      })
      .filter((x) => x.url);
  } catch (error) {
    // on failure, return empty list rather than throwing
    return [];
  }
};

export const getStreamingForAnime = async (animeId: string) => {
  const anime = await prisma.anime.findUnique({
    where: { id: animeId },
    select: { malId: true },
  });
  if (!anime?.malId) return [];
  return getStreamingForMalId(anime.malId);
};

export const getVoiceActorsForMalId = async (malId: number) => {
  try {
    const rows = await fetchJikanAnimeCharacters(malId);
    if (!Array.isArray(rows)) {
      return [];
    }

    const flattened = rows.flatMap((row: any) => {
      const characterName = row?.character?.name ?? "";
      const characterRole = row?.role ?? "";
      const voiceActors = Array.isArray(row?.voice_actors) ? row.voice_actors : [];

      return voiceActors.map((va: any) => ({
        malId: va?.person?.mal_id ?? 0,
        name: va?.person?.name ?? "Unknown",
        image: va?.person?.images?.jpg?.image_url ?? va?.person?.images?.webp?.image_url ?? "",
        language: va?.language ?? "Unknown",
        characterName,
        characterRole,
      }));
    });

    const seen = new Set<string>();
    return flattened.filter((va) => {
      const language = (va.language ?? "").toLowerCase();
      const isJapanese = language === "japanese" || language === "jp";
      if (!isJapanese) {
        return false;
      }

      const key = `${String(va.malId)}:${va.language}:${va.characterName}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return va.malId > 0;
    });
  } catch (error) {
    if (
      error instanceof JikanApiError &&
      (error.status === 404 || error.status === 429 || error.status >= 500)
    ) {
      return [];
    }
    throw error;
  }
};
