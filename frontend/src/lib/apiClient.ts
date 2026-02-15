import type { ScoreRequest, ScoreResponse } from "@/types/score";

export async function fetchScores(payload: ScoreRequest): Promise<ScoreResponse> {
  const response = await fetch("/api/score", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to fetch scores");
  }

  return response.json() as Promise<ScoreResponse>;
}
