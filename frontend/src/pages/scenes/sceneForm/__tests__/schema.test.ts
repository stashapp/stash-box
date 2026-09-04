import { PerformerSchema } from "src/pages/performers/performerForm/schema";
import { describe, expect, it } from "vitest";

import { SceneSchema } from "../schema";

const CASES = [
  { date: "2019", valid: true },
  { date: "2019-06", valid: true },
  { date: "2019-06-15", valid: true },
  { date: "19", valid: false },
  { date: "2019-6", valid: false },
  { date: "06-2019", valid: false },
  { date: "2019-13", valid: false },
  { date: "2019-02-30", valid: false },
  { date: "1899", valid: false },
];

const sceneAccepts = async (date: string) => {
  try {
    await SceneSchema.validateAt("date", { date });
    return true;
  } catch {
    return false;
  }
};

const imageDateAccepts = async (date: string) => {
  try {
    await PerformerSchema.validateAt("images[0].date", {
      images: [{ image: { id: "x" }, types: [], date: date }],
    });
    return true;
  } catch {
    return false;
  }
};

describe("partial date fields agree with each other", () => {
  for (const { date, valid } of CASES) {
    it(`${valid ? "accepts" : "rejects"} ${date}`, async () => {
      expect(await sceneAccepts(date)).toBe(valid);
      expect(await imageDateAccepts(date)).toBe(valid);
    });
  }

  // Scenes can have dates in the future but images literally cannot exist
  // before they are taken / created
  it("differs only on future dates", async () => {
    const nextYear = `${new Date().getFullYear() + 1}`;
    expect(await sceneAccepts(nextYear)).toBe(true);
    expect(await imageDateAccepts(nextYear)).toBe(false);
  });
});
