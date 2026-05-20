import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";
import { animeRoutes } from "./routes/anime.routes";

const port = Number(process.env.PORT || 3001);

const app = new Elysia()
  .use(cors())
  .get("/health", () => ({ status: "ok" }))
  .use(animeRoutes)
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        message: "Invalid request payload",
      };
    }

    set.status = 500;
    return {
      message: "Unexpected server error",
      detail: error instanceof Error ? error.message : "Unknown error",
    };
  })
  .listen(port);

console.log(`AniSwipe backend running on http://localhost:${app.server?.port}`);
