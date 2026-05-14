// Minimal SMTP + HTTP capture server for E2E tests. Listens for SMTP on
// :1025, parses each delivery into a JSON envelope, and exposes the captured
// messages over an HTTP API on :1080.
//
//   GET    /messages         -> [{ id, to, from, subject, text, html, ... }, ...]
//   DELETE /messages         -> clears the buffer
//   GET    /healthz          -> { ok: true }
//
// Spawned by Playwright as a `webServer` entry. Tests read /messages to pull
// activation/reset tokens out of mail bodies — see helpers/email.ts.

import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { createServer } from "node:http";

type Captured = {
  id: number;
  to: string[];
  from: string;
  subject: string;
  text: string;
  html: string;
  receivedAt: number;
};

const messages: Captured[] = [];
let nextId = 1;

const SMTP_PORT = Number(process.env.MOCK_SMTP_PORT ?? 1025);
const HTTP_PORT = Number(process.env.MOCK_SMTP_HTTP_PORT ?? 1080);

const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ["STARTTLS"],
  onData(stream, _session, cb) {
    let raw = "";
    stream.setEncoding("utf-8");
    stream.on("data", (chunk: string) => {
      raw += chunk;
    });
    stream.on("end", async () => {
      try {
        const parsed = await simpleParser(raw);
        const collectAddrs = (
          field: typeof parsed.to | typeof parsed.from,
        ): string[] => {
          const items = Array.isArray(field) ? field : field ? [field] : [];
          return items.flatMap(
            (a) => a?.value?.map((v) => v.address ?? "").filter(Boolean) ?? [],
          ) as string[];
        };
        messages.push({
          id: nextId++,
          to: collectAddrs(parsed.to),
          from: collectAddrs(parsed.from)[0] ?? "",
          subject: parsed.subject ?? "",
          text: parsed.text ?? "",
          html: typeof parsed.html === "string" ? parsed.html : "",
          receivedAt: Date.now(),
        });
        cb();
      } catch (err) {
        cb(err as Error);
      }
    });
  },
});

smtp.on("error", (err) => {
  console.error("[mock-smtp] SMTP error:", err);
});

smtp.listen(SMTP_PORT, "127.0.0.1", () => {
  console.log(`[mock-smtp] SMTP listening on 127.0.0.1:${SMTP_PORT}`);
});

const http = createServer((req, res) => {
  if (req.method === "GET" && req.url === "/healthz") {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify({ ok: true }));
  }
  if (req.method === "GET" && req.url === "/messages") {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(messages));
  }
  if (req.method === "DELETE" && req.url === "/messages") {
    messages.length = 0;
    nextId = 1;
    return res.end();
  }
  res.statusCode = 404;
  res.end();
});

http.listen(HTTP_PORT, "127.0.0.1", () => {
  console.log(`[mock-smtp] HTTP API listening on 127.0.0.1:${HTTP_PORT}`);
});
