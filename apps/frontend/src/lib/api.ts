import type { Anime, Recommendation, WatchlistItem } from "@/types/anime";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";
type StreamingItem = { name: string; url?: string };
type VoiceActorItem = {
  malId: number;
  name: string;
  image?: string;
  language: string;
  characterName?: string;
  characterRole?: string;
};
const SESSION_STORAGE_KEY = "aniswipe-session-id";

const getSessionId = () => {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(SESSION_STORAGE_KEY, generated);
  return generated;
};

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const sessionId = getSessionId();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "x-session-id": sessionId,
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json() as Promise<T>;
};

export const api = {
  health: () => request<{ status: string }>("/health"),
  discover: (page = 1, limit = 20) =>
    request<Anime[]>(`/api/anime/discover?page=${page}&limit=${limit}`),
  trending: () => request<Anime[]>("/api/anime/trending"),
  seasonal: () => request<Anime[]>("/api/anime/seasonal"),
  swipe: (animeId: string, action: "like" | "dislike") =>
    request("/api/swipes", {
      method: "POST",
      body: JSON.stringify({ animeId, action }),
    }),
  watchlist: () => request<WatchlistItem[]>("/api/watchlist"),
  addWatchlist: (animeId: string) =>
    request("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ animeId }),
    }),
  removeWatchlist: (animeId: string) =>
    request(`/api/watchlist/${animeId}`, {
      method: "DELETE",
    }),
  streamingByMalId: (malId: number) =>
    request<StreamingItem[]>(`/api/anime/mal/${malId}/streaming`),
  videosByMalId: (malId: number) =>
    request<{ site: string; url: string; title?: string; type?: string }[]>(
      `/api/anime/mal/${malId}/videos`
    ),
  voiceActorsByMalId: (malId: number) =>
    request<VoiceActorItem[]>(`/api/anime/mal/${malId}/voice-actors`),
  recommendations: (limit = 20) => request<Recommendation[]>(`/api/recommendations?limit=${limit}`),
};
