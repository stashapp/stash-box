import { describe, expect, it } from "vitest";
import { diffArray, diffImages, diffURLs, diffValue } from "../diff";

describe("diffArray", () => {
  it("returns [added, removed] using string key", () => {
    const [added, removed] = diffArray(
      ["a", "b", "c"],
      ["b", "c", "d"],
      (x) => x,
    );
    expect(added).toEqual(["a"]);
    expect(removed).toEqual(["d"]);
  });

  it("returns empty arrays for identical lists", () => {
    const [added, removed] = diffArray(["a", "b"], ["a", "b"], (x) => x);
    expect(added).toEqual([]);
    expect(removed).toEqual([]);
  });

  it("treats the entire new list as added when original is empty", () => {
    const [added, removed] = diffArray(["a", "b"], [], (x) => x);
    expect(added).toEqual(["a", "b"]);
    expect(removed).toEqual([]);
  });

  it("treats the entire original list as removed when new is empty", () => {
    const [added, removed] = diffArray([], ["a", "b"], (x) => x);
    expect(added).toEqual([]);
    expect(removed).toEqual(["a", "b"]);
  });

  it("uses key function for objects", () => {
    const [added, removed] = diffArray(
      [{ id: "1" }, { id: "2" }],
      [{ id: "2" }, { id: "3" }],
      (o) => o.id,
    );
    expect(added).toEqual([{ id: "1" }]);
    expect(removed).toEqual([{ id: "3" }]);
  });
});

describe("diffValue", () => {
  it("returns a when both defined and different", () => {
    expect(diffValue("new", "old")).toBe("new");
  });

  it("returns null when values are equal", () => {
    expect(diffValue("same", "same")).toBeNull();
  });

  it("returns null when a is falsy", () => {
    expect(diffValue(null, "old")).toBeNull();
    expect(diffValue(undefined, "old")).toBeNull();
    expect(diffValue("", "old")).toBeNull();
  });

  it("returns new value when b is null/undefined and a is set", () => {
    expect(diffValue("new", null)).toBe("new");
    expect(diffValue("new", undefined)).toBe("new");
  });

  it("works with numbers", () => {
    expect(diffValue(5, 3)).toBe(5);
    expect(diffValue(5, 5)).toBeNull();
  });
});

describe("diffImages", () => {
  const img = (id: string) => ({
    id,
    url: `url-${id}`,
    width: 100,
    height: 200,
  });

  it("computes added and removed images by id", () => {
    const [added, removed] = diffImages(
      [img("1"), img("2")],
      [img("2"), img("3")],
    );
    expect(added).toEqual([img("1")]);
    expect(removed).toEqual([img("3")]);
  });

  it("skips new images missing id/url/dimensions", () => {
    const [added] = diffImages(
      [
        { id: "1", url: "u", width: 10, height: 10 },
        { id: undefined, url: "u", width: 10, height: 10 },
        { id: "2", url: undefined, width: 10, height: 10 },
        { id: "3", url: "u", width: 0, height: 10 },
      ],
      [],
    );
    expect(added).toEqual([{ id: "1", url: "u", width: 10, height: 10 }]);
  });

  it("returns empty diff for identical lists", () => {
    const [added, removed] = diffImages([img("1")], [img("1")]);
    expect(added).toEqual([]);
    expect(removed).toEqual([]);
  });

  it("handles undefined input", () => {
    const [added, removed] = diffImages(undefined, [img("1")]);
    expect(added).toEqual([]);
    expect(removed).toEqual([img("1")]);
  });
});

describe("diffURLs", () => {
  const site = (id: string, name = `site-${id}`) => ({
    id,
    name,
    icon: `icon-${id}`,
  });
  const url = (u: string, siteId: string) => ({
    url: u,
    site: site(siteId),
  });

  it("computes added and removed by site name + url key", () => {
    const [added, removed] = diffURLs(
      [url("https://a", "1"), url("https://b", "2")],
      [url("https://b", "2"), url("https://c", "3")],
    );
    expect(added).toEqual([url("https://a", "1")]);
    expect(removed).toEqual([url("https://c", "3")]);
  });

  it("returns empty diff when lists match", () => {
    const [added, removed] = diffURLs(
      [url("https://a", "1")],
      [url("https://a", "1")],
    );
    expect(added).toEqual([]);
    expect(removed).toEqual([]);
  });

  it("treats same URL on different sites as different entries", () => {
    const [added, removed] = diffURLs(
      [url("https://a", "1")],
      [url("https://a", "2")],
    );
    expect(added).toEqual([url("https://a", "1")]);
    expect(removed).toEqual([url("https://a", "2")]);
  });

  it("handles undefined input", () => {
    const [added, removed] = diffURLs(undefined, [url("https://a", "1")]);
    expect(added).toEqual([]);
    expect(removed).toEqual([url("https://a", "1")]);
  });

  it("normalizes missing site fields to empty strings", () => {
    const [added] = diffURLs([{ url: "https://a", site: undefined }], []);
    expect(added).toEqual([
      { url: "https://a", site: { id: "", name: "", icon: "" } },
    ]);
  });
});
