const SOUL_V2_ENDPOINT = "https://api.higgsfield.ai/higgsfield-ai/soul/v2/standard";
const TERMINAL_STATUSES = new Set(["completed", "failed", "nsfw", "canceled"]);
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 50_000;

type HiggsfieldQueued = { status: string; request_id: string; status_url: string; cancel_url: string };
type HiggsfieldStatus = HiggsfieldQueued & { images?: { url: string }[] };

export function higgsfieldReady() {
  return Boolean(process.env.HIGGSFIELD_API_KEY);
}

async function higgsfieldFetch(url: string, init?: RequestInit): Promise<HiggsfieldStatus> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Key ${process.env.HIGGSFIELD_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`Higgsfield API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Submits a prompt to Soul V2 and polls status_url until the async job
// reaches a terminal state, per Higgsfield's queued -> poll pattern.
export async function generateImage(prompt: string): Promise<string> {
  const queued = await higgsfieldFetch(SOUL_V2_ENDPOINT, {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });

  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);
    const status = await higgsfieldFetch(queued.status_url);
    if (TERMINAL_STATUSES.has(status.status)) {
      if (status.status === "completed" && status.images?.[0]?.url) {
        return status.images[0].url;
      }
      throw new Error(`Image generation ${status.status}.`);
    }
  }
  throw new Error("Image generation timed out.");
}
