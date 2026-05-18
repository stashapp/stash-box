// Helpers for asserting on emails captured by the local mock-smtp server.
// The server runs at MOCK_SMTP_HTTP (default http://127.0.0.1:1080) and is
// started by Playwright's `webServer` array. See e2e/mock-smtp/server.ts.

const MOCK_SMTP_HTTP =
  process.env.MOCK_SMTP_HTTP ?? "http://127.0.0.1:1080";

export type CapturedEmail = {
  id: number;
  to: string[];
  from: string;
  subject: string;
  text: string;
  html: string;
  receivedAt: number;
};

/** Clear all captured messages. Call at the start of email-dependent tests. */
export async function resetEmails(): Promise<void> {
  await fetch(`${MOCK_SMTP_HTTP}/messages`, { method: "DELETE" });
}

/**
 * Poll until an email addressed to `address` arrives, then return it. Returns
 * the *latest* matching message, so tests don't accidentally pick up a stale
 * mail from an earlier test that forgot to call `resetEmails`.
 */
export async function waitForEmailTo(
  address: string,
  opts: { timeoutMs?: number; minReceivedAt?: number } = {},
): Promise<CapturedEmail> {
  const { timeoutMs = 15_000, minReceivedAt = 0 } = opts;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fetch(`${MOCK_SMTP_HTTP}/messages`);
    const msgs = (await r.json()) as CapturedEmail[];
    const hit = msgs
      .filter((m) => m.to.includes(address) && m.receivedAt >= minReceivedAt)
      .at(-1);
    if (hit) return hit;
    await new Promise((res) => setTimeout(res, 200));
  }
  throw new Error(`no email to ${address} within ${timeoutMs}ms`);
}

/**
 * Pull the first URL from an email body that matches the regex. Handy for
 * extracting activation/reset links — the templates wrap them in either
 * plain text or an <a href=>, so check both bodies.
 */
export function extractLink(
  mail: CapturedEmail,
  pattern: RegExp,
): string | null {
  const m = pattern.exec(mail.text) ?? pattern.exec(mail.html);
  return m?.[0] ?? null;
}
