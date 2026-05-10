export type FeedbackSubmitResult =
  | { ok: true }
  | { ok: false; error: string; code?: string; status: number };

const TRANSIENT_STATUSES = new Set([502, 503, 504]);
const RETRY_DELAY_MS = 500;

export async function submitFeedback(formData: FormData): Promise<FeedbackSubmitResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch("/api/feedback", { method: "POST", body: formData });
      if (res.ok) return { ok: true };

      const { error, code } = await readErrorBody(res);

      if (TRANSIENT_STATUSES.has(res.status) && attempt === 0) {
        console.warn(
          `[feedback] transient ${res.status}, retrying once`,
          code ? `(code=${code})` : ""
        );
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      console.error("[feedback] submit failed", { status: res.status, code, error });
      return { ok: false, error, code, status: res.status };
    } catch (err) {
      // Network error / fetch threw
      if (attempt === 0) {
        console.warn("[feedback] network error, retrying once", err);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      const message = err instanceof Error ? err.message : "Network error";
      console.error("[feedback] submit failed (network)", message);
      return { ok: false, error: message, status: 0 };
    }
  }
  return { ok: false, error: "Failed to submit", status: 0 };
}

async function readErrorBody(res: Response): Promise<{ error: string; code?: string }> {
  const fallback = `Request failed (${res.status})`;
  const contentType = res.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const data = (await res.json()) as { error?: unknown; code?: unknown };
      const error = typeof data?.error === "string" ? data.error : fallback;
      const code = typeof data?.code === "string" ? data.code : undefined;
      return { error, code };
    }
    const text = await res.text();
    return { error: text.trim().slice(0, 200) || fallback };
  } catch {
    return { error: fallback };
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
