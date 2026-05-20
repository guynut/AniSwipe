import { Elysia, t } from "elysia";
import {
  addToWatchlist,
  fetchAndCacheDiscoverAnime,
  fetchAndCacheSeasonalAnime,
  fetchAndCacheTrendingAnime,
  getStreamingForMalId,
  getStreamingForAnime,
  getVoiceActorsForMalId,
  getVideosForMalId,
  getAnimeById,
  getRecommendations,
  getWatchlist,
  removeFromWatchlist,
  saveSwipe,
} from "../services/anime.service";

const getSessionId = (request: Request) =>
  request.headers.get("x-session-id")?.trim() || "anonymous";

export const animeRoutes = new Elysia({ prefix: "/api" })
  .get("/anime/discover", async ({ query, request }) => {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const sessionId = getSessionId(request);

    return fetchAndCacheDiscoverAnime(page, limit, sessionId);
  })
  .get("/anime/trending", async () => {
    return fetchAndCacheTrendingAnime();
  })
  .get("/anime/seasonal", async () => {
    return fetchAndCacheSeasonalAnime();
  })
  .get("/anime/:animeId", async ({ params, set }) => {
    const anime = await getAnimeById(params.animeId);

    if (!anime) {
      set.status = 404;
      return { message: "Anime not found" };
    }

    return anime;
  })
  .get("/anime/:animeId/streaming", async ({ params, set }) => {
    try {
      const streaming = await getStreamingForAnime(params.animeId);
      return streaming;
    } catch (e) {
      set.status = 502;
      return { message: "Failed to fetch streaming info" };
    }
  })
  .get("/anime/mal/:malId/videos", async ({ params, set }) => {
    const malId = Number(params.malId);
    if (Number.isNaN(malId)) {
      set.status = 400;
      return { message: "Invalid malId" };
    }

    try {
      const videos = await getVideosForMalId(malId);
      return videos;
    } catch {
      set.status = 502;
      return { message: "Failed to fetch videos" };
    }
  })
  .get("/anime/mal/:malId/voice-actors", async ({ params, set }) => {
    const malId = Number(params.malId);
    if (Number.isNaN(malId)) {
      set.status = 400;
      return { message: "Invalid malId" };
    }

    try {
      return await getVoiceActorsForMalId(malId);
    } catch {
      set.status = 502;
      return { message: "Failed to fetch voice actors" };
    }
  })
  .get("/anime/mal/:malId/streaming", async ({ params, set }) => {
    const malId = Number(params.malId);
    if (Number.isNaN(malId)) {
      set.status = 400;
      return { message: "Invalid malId" };
    }

    try {
      return await getStreamingForMalId(malId);
    } catch {
      set.status = 502;
      return { message: "Failed to fetch streaming info" };
    }
  })
  .post(
    "/swipes",
    async ({ body, request }) => {
      const sessionId = getSessionId(request);
      return saveSwipe(body.animeId, body.action, sessionId);
    },
    {
      body: t.Object({
        animeId: t.String(),
        action: t.Union([t.Literal("like"), t.Literal("dislike")]),
      }),
    }
  )
  .get("/watchlist", async ({ request }) => {
    const sessionId = getSessionId(request);
    return getWatchlist(sessionId);
  })
  .post(
    "/watchlist",
    async ({ body, request }) => {
      const sessionId = getSessionId(request);
      return addToWatchlist(body.animeId, sessionId);
    },
    {
      body: t.Object({
        animeId: t.String(),
      }),
    }
  )
  .delete("/watchlist/:animeId", async ({ params, request, set }) => {
    const sessionId = getSessionId(request);
    try {
      const result = await removeFromWatchlist(params.animeId, sessionId);
      if (result.count === 0) {
        set.status = 404;
        return { message: "Anime was not in watchlist" };
      }
      return result;
    } catch {
      set.status = 404;
      return { message: "Anime was not in watchlist" };
    }
  })
  .get("/recommendations", async ({ query, request }) => {
    const limit = Number(query.limit ?? 20);
    const sessionId = getSessionId(request);
    return getRecommendations(limit, sessionId);
  });
