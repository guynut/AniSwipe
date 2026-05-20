# AniSwipe

AniSwipe is a modern full-stack Tinder-style anime recommendation app. Users swipe through anime cards, build preferences from likes/dislikes, and get genre-aware recommendations.

## Tech Stack

- Frontend: React + TypeScript + Vite
- UI: TailwindCSS + shadcn-style reusable UI components
- Animation: Framer Motion
- State Management: Zustand
- Backend: Elysia.js running on Bun
- Database: SQLite + Prisma ORM
- External API: Jikan (MyAnimeList unofficial API)
- DevOps: Docker, Docker Compose, GitHub Actions

## Project Structure

```bash
apps/
  frontend/
  backend/
```

## Features

- Tinder-like swipe interaction (drag gestures)
- LIKE / NOPE overlay indicators
- Infinite card loading
- Anime detail modal
- Watchlist page
- Recommendation page (genre-weighted)
- Seasonal anime section
- Trending anime section
- Loading skeletons and toast notifications
- API error handling and caching

## Quick Start (Local)

### 1) Install dependencies

```bash
bun install
```

### 2) Environment variables

```bash
cp .env.example .env
```

### 3) Backend database setup

```bash
bun run --cwd apps/backend prisma:generate
bun run --cwd apps/backend prisma:push
```

### 4) Run development servers

```bash
bun run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## Scripts

- `bun run dev` - run frontend and backend concurrently
- `bun run format` - format all code with Biome
- `bun run format:check` - verify code formatting with Biome
- `bun run build` - build frontend + backend
- `bun run test` - run frontend + backend tests
- `bun run typecheck` - run TypeScript checks for frontend + backend
- `bun run --cwd apps/backend prisma:push` - sync schema to SQLite

## API Endpoints

- `GET /health`
- `GET /api/anime/discover?page=1&limit=20`
- `GET /api/anime/trending`
- `GET /api/anime/seasonal`
- `GET /api/anime/:animeId`
- `POST /api/swipes` with `{ animeId, action }`
- `GET /api/watchlist`
- `POST /api/watchlist` with `{ animeId }`
- `DELETE /api/watchlist/:animeId`
- `GET /api/recommendations?limit=20`

## Recommendation Logic

Recommendations are generated from:

1. Liked swipe history
2. Genre overlap frequency
3. Anime score signal
4. Popularity signal

Each candidate receives a computed recommendation score and is sorted descending.

## Docker

### Build and run via Docker Compose

```bash
docker compose up --build
```

- Frontend container serves app at `http://localhost:5173`
- Backend container serves API at `http://localhost:3001`

## CI Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs:

1. install
2. prisma generate
3. format check
4. typecheck
5. build
6. test
7. docker build (frontend + backend)

## Notes

- All source code is TypeScript.
- Prisma uses SQLite (`apps/backend/prisma/dev.db`) by default.
- The backend caches anime returned from Jikan into SQLite.
