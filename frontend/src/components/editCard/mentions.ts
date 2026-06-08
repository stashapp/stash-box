// Scans @<name> and @"<quoted name>" tokens out of comment text. Mirrors the
// Go-side walker in internal/service/notification/mentions.go so the preview
// resolves the same set of mentions the backend will normalize.

// Mirrors notification.MaxMentions in the backend. Mentions past this cap are
// left as plain @<name> text instead of being linked.
export const MAX_MENTIONS = 4;

interface MentionToken {
  start: number;
  end: number;
  name: string;
}

const isWordChar = (ch: string) => /[A-Za-z0-9_]/.test(ch);
const isAlphaNum = (ch: string) => /[A-Za-z0-9]/.test(ch);
const isNameChar = (ch: string) => /[A-Za-z0-9._-]/.test(ch);

const scanMentionTokens = (body: string): MentionToken[] => {
  const tokens: MentionToken[] = [];
  let i = 0;
  const n = body.length;
  while (i < n) {
    if (body.startsWith("```", i)) {
      const end = body.indexOf("```", i + 3);
      if (end < 0) return tokens;
      i = end + 3;
      continue;
    }
    if (body[i] === "`") {
      const end = body.indexOf("`", i + 1);
      if (end < 0) return tokens;
      i = end + 1;
      continue;
    }
    if (body[i] === "@") {
      const prev = i > 0 ? body[i - 1] : "";
      if (i === 0 || !isWordChar(prev)) {
        if (body[i + 1] === '"') {
          const end = body.indexOf('"', i + 2);
          if (end > i + 1) {
            tokens.push({
              start: i,
              end: end + 1,
              name: body.slice(i + 2, end),
            });
            i = end + 1;
            continue;
          }
        }
        if (i + 1 < n && isAlphaNum(body[i + 1])) {
          let j = i + 2;
          while (j < n && isNameChar(body[j])) j++;
          tokens.push({ start: i, end: j, name: body.slice(i + 1, j) });
          i = j;
          continue;
        }
      }
    }
    i++;
  }
  return tokens;
};

export const extractMentionNames = (body: string): string[] => {
  const tokens = scanMentionTokens(body);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    const key = t.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t.name);
  }
  return out;
};

export const rewriteMentionsToIds = (
  body: string,
  lookup: Map<string, string>,
): string => {
  const tokens = scanMentionTokens(body);
  if (tokens.length === 0) return body;
  const parts: string[] = [];
  let last = 0;
  for (const t of tokens) {
    parts.push(body.slice(last, t.start));
    const id = lookup.get(t.name.toLowerCase());
    parts.push(id ? `@${id}` : body.slice(t.start, t.end));
    last = t.end;
  }
  parts.push(body.slice(last));
  return parts.join("");
};
