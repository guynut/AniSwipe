import { describe, expect, it } from "bun:test";
import { rankRecommendations } from "./recommendation";

describe("rankRecommendations", () => {
  it("prioritizes anime that matches liked genres", () => {
    const ranked = rankRecommendations(
      [
        {
          id: "1",
          title: "Action Hero",
          score: 8.1,
          popularity: 120,
          genres: ["Action", "Adventure"],
        },
        {
          id: "2",
          title: "Romance Story",
          score: 8.9,
          popularity: 50,
          genres: ["Romance"],
        },
      ],
      {
        Action: 5,
        Adventure: 3,
      }
    );

    expect(ranked[0].title).toBe("Action Hero");
  });
});
