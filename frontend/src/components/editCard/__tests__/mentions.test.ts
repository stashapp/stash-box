import { describe, expect, it } from "vitest";
import {
  extractMentionNames,
  MAX_MENTIONS,
  rewriteMentionsToIds,
} from "../mentions";

describe("extractMentionNames", () => {
  it("returns empty list when there are no mentions", () => {
    expect(extractMentionNames("hello world")).toEqual([]);
  });

  it("picks up a bare @name", () => {
    expect(extractMentionNames("hey @alice welcome")).toEqual(["alice"]);
  });

  it('picks up a quoted @"name with space"', () => {
    expect(extractMentionNames('ping @"Alice Cooper" please')).toEqual([
      "Alice Cooper",
    ]);
  });

  it("ignores email-like @ that follows an alphanum", () => {
    expect(extractMentionNames("user@example not a mention")).toEqual([]);
  });

  it("dedupes mentions case-insensitively, keeps first casing", () => {
    expect(extractMentionNames("@alice and @Alice")).toEqual(["alice"]);
  });

  it("preserves order of first occurrence", () => {
    expect(extractMentionNames('@bob then @"Alice Cooper"')).toEqual([
      "bob",
      "Alice Cooper",
    ]);
  });

  it("skips mentions inside inline code", () => {
    expect(extractMentionNames("see `@alice` not a mention")).toEqual([]);
  });

  it("skips mentions inside fenced code", () => {
    expect(extractMentionNames("```\n@alice\n```")).toEqual([]);
  });

  it("ignores trailing punctuation outside the name token", () => {
    expect(extractMentionNames("hey @alice!")).toEqual(["alice"]);
  });
});

describe("rewriteMentionsToIds", () => {
  const id = "550e8400-e29b-41d4-a716-446655440000";
  const id2 = "11111111-2222-3333-4444-555555555555";
  const lookup = new Map([
    ["alice", id],
    ["alice cooper", id2],
  ]);

  it("replaces a bare match", () => {
    expect(rewriteMentionsToIds("hey @alice", lookup)).toBe(`hey @${id}`);
  });

  it("replaces a quoted match", () => {
    expect(rewriteMentionsToIds('ping @"Alice Cooper" now', lookup)).toBe(
      `ping @${id2} now`,
    );
  });

  it("leaves unmatched names alone", () => {
    expect(rewriteMentionsToIds("@bob unchanged", lookup)).toBe(
      "@bob unchanged",
    );
  });

  it("leaves mentions inside inline code alone", () => {
    expect(rewriteMentionsToIds("`@alice` and @alice", lookup)).toBe(
      `\`@alice\` and @${id}`,
    );
  });

  it("returns input unchanged when no mentions present", () => {
    expect(rewriteMentionsToIds("plain text", lookup)).toBe("plain text");
  });

  it("rewrites multiple mentions in one pass", () => {
    expect(
      rewriteMentionsToIds('@alice met @"Alice Cooper" today', lookup),
    ).toBe(`@${id} met @${id2} today`);
  });
});

describe("mention cap (frontend preview parity)", () => {
  it("MAX_MENTIONS matches the documented cap", () => {
    expect(MAX_MENTIONS).toBe(4);
  });

  it("preview-style truncation leaves later mentions as @<name>", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const names = ["a", "b", "c", "d", "e"];
    const text = names.map((n) => `@${n}`).join(" ");
    // Mirrors NoteInput's preview pipeline: slice to MAX_MENTIONS before
    // building the lookup, so names past the cap aren't rewritten.
    const capped = extractMentionNames(text).slice(0, MAX_MENTIONS);
    const lookup = new Map(capped.map((n) => [n.toLowerCase(), id]));
    const out = rewriteMentionsToIds(text, lookup);
    expect(out.match(new RegExp(`@${id}`, "g"))?.length).toBe(MAX_MENTIONS);
    expect(out).toContain("@e");
  });
});
