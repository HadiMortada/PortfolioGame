import type { Config, Context } from "@netlify/edge-functions";
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";

const allowedObjects = new Set(["fruit", "animal", "empty"]);

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export default async function handler(req: Request, context: Context) {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const body = await req.json().catch(() => null) as any;
  if (!body || typeof body !== "object") return json({ error: "Invalid JSON body." }, 400);

  try {
    const client = new TypeSafeClient();

    if (body.action === "connect") {
      const started = Date.now();
      const result = await client.systemOne({
        state: { ping: "jev-runner-edge" },
        questions: {
          ok: choice("Choose READY.", { READY: null, NOT_READY: null }),
        },
      });

      return json({
        ok: result.answers.ok.choice === "READY",
        model: "jev-latest",
        provider: "netlify-edge-typesafe",
        edgeRegion: context.server?.region ?? null,
        latencyMs: Date.now() - started,
      });
    }

    if (body.action !== "runner") return json({ error: "Unknown action." }, 400);

    const goal = body.goal === "animal" ? "animal" : body.goal === "fruit" ? "fruit" : "";
    const lanes = body.lanes && typeof body.lanes === "object" && !Array.isArray(body.lanes)
      ? body.lanes
      : null;

    if (!goal || !lanes) return json({ error: "Runner requires goal and lanes." }, 400);

    const clean = {
      LEFT: String(lanes.LEFT ?? ""),
      CENTER: String(lanes.CENTER ?? ""),
      RIGHT: String(lanes.RIGHT ?? ""),
    };

    if (!Object.values(clean).every((v) => allowedObjects.has(v))) {
      return json({ error: "Lane values must be fruit, animal, or empty." }, 400);
    }

    const avoid = goal === "fruit" ? "animal" : "fruit";
    const started = Date.now();

    const result = await client.systemOne({
      state: {
        goal,
        avoid,
        LEFT: clean.LEFT,
        CENTER: clean.CENTER,
        RIGHT: clean.RIGHT,
      },
      questions: {
        target_lane: choice(
          "Pick the lane containing goal. If none, pick empty. Never pick avoid.",
          { LEFT: null, CENTER: null, RIGHT: null },
        ),
      },
    });

    const answer: any = result.answers.target_lane;

    return json({
      model: "jev-latest",
      choice: answer.choice,
      confidence: answer.confidence ?? null,
      probabilities: answer.probabilities ?? {},
      usage: (result as any).usage ?? null,
      latencyMs: Date.now() - started,
      provider: "netlify-edge-typesafe",
      edgeRegion: context.server?.region ?? null,
    });
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : String(error),
      provider: "netlify-edge-typesafe",
      edgeRegion: context.server?.region ?? null,
    }, 502);
  }
}

export const config: Config = {
  path: "/api/jev-runner",
};
