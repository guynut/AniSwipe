import { create } from "zustand";
import { api } from "@/lib/api";
import type { Anime } from "@/types/anime";

type AnimeStore = {
  cards: Anime[];
  seasonal: Anime[];
  trending: Anime[];
  loading: boolean;
  error: string | null;
  page: number;
  selectedAnime: Anime | null;
  loadInitial: () => Promise<void>;
  loadMore: () => Promise<void>;
  registerSwipe: (anime: Anime, action: "like" | "dislike") => Promise<void>;
  setSelectedAnime: (anime: Anime | null) => void;
};

export const useAnimeStore = create<AnimeStore>((set, get) => ({
  cards: [],
  seasonal: [],
  trending: [],
  loading: false,
  error: null,
  page: 1,
  selectedAnime: null,
  loadInitial: async () => {
    set({ loading: true, error: null, page: 1 });
    try {
      const [discover, seasonal, trending] = await Promise.all([
        api.discover(1),
        api.seasonal(),
        api.trending(),
      ]);
      set({ cards: discover, seasonal, trending, loading: false, page: 2 });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  loadMore: async () => {
    const page = get().page;
    try {
      const next = await api.discover(page);
      set((state) => ({ cards: [...state.cards, ...next], page: state.page + 1 }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to load more" });
    }
  },
  registerSwipe: async (anime, action) => {
    await api.swipe(anime.id, action);
    if (action === "like") {
      await api.addWatchlist(anime.id);
    }
  },
  setSelectedAnime: (anime) => {
    set({ selectedAnime: anime });
  },
}));
