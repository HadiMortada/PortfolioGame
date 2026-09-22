import type { Config, Context } from "@netlify/functions";
import { choice, TypeSafeClient } from "@typesafe-ai/sdk";

const allowedObjects = new Set(["fruit", "animal", "empty"]);

function cors(origin: string | null) {
  const allowed =
    origin === null ||
    origin === "https://hadimortada.github.io" ||
    origin.endsWith(".netlify.app") ||
    origin.startsWith("http://localhost:");
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "https://hadimortada.github.io",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function json(data: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(data), { status, headers: cors(origin) });
}

export default async (req: Request, context: Context) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors(origin) });
  }
  if (req.method !== "POST") {
    return json({ error: "POST only" }, 405, origin);
  }

  const body = await req.json().catch(() => null) as any;
  if (!body || typeof body !== "object") {
    return json({ error: "Invalid JSON body." }, 400, origin);
  }

  try {
    const client = new TypeSafeClient();

    if (body.action === "connect") {
      const started = Date.now();
      const result = await client.systemOne({
        state: { ping: "jev-runner" },
        questions: {
          ok: choice("Choose READY.", { READY: null, NOT_READY: null }),
        },
      });
      return json({
        ok: result.answers.ok.choice === "READY",
        model: "jev-latest",
        provider: "netlify-typesafe",
        latencyMs: Date.now() - started,
        requestId: context.requestId,
      }, 200, origin);
    }

    if (body.action !== "runner") {
      return json({ error: "Unknown action." }, 400, origin);
    }

    const goal = body.goal === "animal" ? "animal" : body.goal === "fruit" ? "fruit" : "";
    const lanes = body.lanes && typeof body.lanes === "object" && !Array.isArray(body.lanes)
      ? body.lanes
      : null;

    if (!goal || !lanes) {
      return json({ error: "Runner requires goal and lanes." }, 400, origin);
    }

    const clean = {
      LEFT: String(lanes.LEFT ?? ""),
      CENTER: String(lanes.CENTER ?? ""),
      RIGHT: String(lanes.RIGHT ?? ""),
    };

    if (!Object.values(clean).every((v) => allowedObjects.has(v))) {
      return json({ error: "Lane values must be fruit, animal, or empty." }, 400, origin);
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
      provider: "netlify-typesafe",
      requestId: context.requestId,
    }, 200, origin);
  } catch (error) {
    return json({
      error: error instanceof Error ? error.message : String(error),
      provider: "netlify-typesafe",
      requestId: context.requestId,
    }, 502, origin);
  }
};

export const config: Config = {
  path: "/api/jev-runner-node",
};
