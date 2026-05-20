const JIKAN_BASE_URL = process.env.JIKAN_BASE_URL || "https://api.jikan.moe/v4";
const JIKAN_MAX_RETRIES = 3;
const JIKAN_BASE_BACKOFF_MS = 700;

type JikanAnime = {
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
};

export class JikanApiError extends Error {
  status: number;
  retryAfterMs?: number;

  constructor(status: number, retryAfterMs?: number) {
    super(`Jikan API error: ${status}`);
    this.name = "JikanApiError";
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

const sleep = async (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getRetryDelayMs = (response: Response, attempt: number) => {
  const retryAfterHeader = response.headers.get("retry-after");
  const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : Number.NaN;
  if (!Number.isNaN(retryAfterSeconds) && retryAfterSeconds > 0) {
    return retryAfterSeconds * 1000;
  }

  return JIKAN_BASE_BACKOFF_MS * 2 ** attempt;
};

export const fetchJikanAnime = async (
  path: string,
  searchParams: Record<string, string | number | undefined> = {}
): Promise<JikanAnime[]> => {
  const url = new URL(`${JIKAN_BASE_URL}${path}`);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  for (let attempt = 0; attempt <= JIKAN_MAX_RETRIES; attempt += 1) {
    const response = await fetch(url.toString());

    if (response.ok) {
      const payload = (await response.json()) as { data: JikanAnime[] };
      return payload.data;
    }

    if (response.status === 429 && attempt < JIKAN_MAX_RETRIES) {
      const delayMs = getRetryDelayMs(response, attempt);
      await sleep(delayMs);
      continue;
    }

    const retryAfterMs = response.status === 429 ? getRetryDelayMs(response, attempt) : undefined;
    throw new JikanApiError(response.status, retryAfterMs);
  }

  throw new JikanApiError(429);
};

export const fetchJikanAnimeDetail = async (malId: number) => {
  const url = `${JIKAN_BASE_URL}/anime/${malId}/full`;
  for (let attempt = 0; attempt <= JIKAN_MAX_RETRIES; attempt += 1) {
    const response = await fetch(url);

    if (response.ok) {
      const payload = await response.json();
      // payload.data expected
      return payload.data ?? payload;
    }

    if (response.status === 429 && attempt < JIKAN_MAX_RETRIES) {
      const delayMs = getRetryDelayMs(response, attempt);
      await sleep(delayMs);
      continue;
    }

    const retryAfterMs = response.status === 429 ? getRetryDelayMs(response, attempt) : undefined;
    throw new JikanApiError(response.status, retryAfterMs);
  }

  throw new JikanApiError(429);
};

export const fetchJikanAnimeVideos = async (malId: number) => {
  const url = `${JIKAN_BASE_URL}/anime/${malId}/videos`;
  for (let attempt = 0; attempt <= JIKAN_MAX_RETRIES; attempt += 1) {
    const response = await fetch(url);

    if (response.ok) {
      const payload = await response.json();
      return payload.data ?? payload;
    }

    if (response.status === 429 && attempt < JIKAN_MAX_RETRIES) {
      const delayMs = getRetryDelayMs(response, attempt);
      await sleep(delayMs);
      continue;
    }

    const retryAfterMs = response.status === 429 ? getRetryDelayMs(response, attempt) : undefined;
    throw new JikanApiError(response.status, retryAfterMs);
  }

  throw new JikanApiError(429);
};

export const fetchJikanAnimeCharacters = async (malId: number) => {
  const url = `${JIKAN_BASE_URL}/anime/${malId}/characters`;
  for (let attempt = 0; attempt <= JIKAN_MAX_RETRIES; attempt += 1) {
    const response = await fetch(url);

    if (response.ok) {
      const payload = await response.json();
      return payload.data ?? payload;
    }

    if (response.status === 429 && attempt < JIKAN_MAX_RETRIES) {
      const delayMs = getRetryDelayMs(response, attempt);
      await sleep(delayMs);
      continue;
    }

    const retryAfterMs = response.status === 429 ? getRetryDelayMs(response, attempt) : undefined;
    throw new JikanApiError(response.status, retryAfterMs);
  }

  throw new JikanApiError(429);
};
