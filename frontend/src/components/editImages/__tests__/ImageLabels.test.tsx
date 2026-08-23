import { screen } from "@testing-library/react";
import {
  ImageTypeEnum,
  ImageTypeGroupEnum,
  type ImageTypeGroupsQuery,
} from "src/graphql";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it, vi } from "vitest";

import ImageLabels from "../ImageLabels";
import type { TypedImage } from "../types";

// A cut-down vocabulary carrying the two rules that matter:
// - a face crop cannot be topless (you can't see that part)
// - a face crop cannot be from behind (faces are on the front of the head)
const GROUPS = [
  {
    __typename: "ImageTypeGroup" as const,
    enabled: true,
    key: ImageTypeGroupEnum.CROP,
    name: "Crop",
    description: "How much of the subject is in frame?",
    types: [
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.CROP_FACE,
        name: "Face",
        description: "Collarbone up.",
        conflicts_with: [ImageTypeEnum.DRESS_TOPLESS, ImageTypeEnum.VIEW_BACK],
      },
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.CROP_THREE_QUARTER,
        name: "Three-quarter",
        description: "Mid-thigh up.",
        conflicts_with: [],
      },
    ],
  },
  {
    __typename: "ImageTypeGroup" as const,
    enabled: true,
    key: ImageTypeGroupEnum.VIEW,
    name: "Pose",
    description: "Where is the camera?",
    types: [
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.VIEW_FRONT,
        name: "Front",
        description: "",
        conflicts_with: [],
      },
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.VIEW_BACK,
        name: "Back",
        description: "",
        conflicts_with: [ImageTypeEnum.CROP_FACE],
      },
    ],
  },
  {
    __typename: "ImageTypeGroup" as const,
    enabled: true,
    key: ImageTypeGroupEnum.DRESS,
    name: "State of dress",
    description: "",
    types: [
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.DRESS_NON_NUDE,
        name: "Non-nude",
        description: "",
        conflicts_with: [],
      },
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.DRESS_TOPLESS,
        name: "Topless",
        description: "",
        conflicts_with: [ImageTypeEnum.CROP_FACE],
      },
    ],
  },
] satisfies ImageTypeGroupsQuery["imageTypeGroups"];

const IMAGE = {
  id: "img-1",
  url: "https://example.com/img-1.jpg",
  width: 400,
  height: 600,
} as TypedImage["image"];

const setup = (
  types: ImageTypeEnum[] = [],
  date: string | null = null,
  groups: ImageTypeGroupsQuery["imageTypeGroups"] = GROUPS,
) => {
  const onChange = vi.fn();
  const value = {
    image: IMAGE,
    types,
    date: date,
  } as TypedImage;
  const utils = renderForm(
    <ImageLabels groups={groups} value={value} onChange={onChange} />,
  );
  return { ...utils, onChange };
};

// Types can either be disabled individually or as part of their group
const OFF_AT = ["type", "group"] as const;

// The same vocabulary with Topless switched off, at either level
const withToplessOff = (level: (typeof OFF_AT)[number]) =>
  GROUPS.map((group) =>
    group.key !== ImageTypeGroupEnum.DRESS
      ? group
      : {
          ...group,
          enabled: level === "type",
          types: group.types.map((type) =>
            type.key === ImageTypeEnum.DRESS_TOPLESS && level === "type"
              ? { ...type, enabled: false }
              : type,
          ),
        },
  );

const offered = async (user: ReturnType<typeof setup>["user"]) => {
  await user.click(screen.getByLabelText("Add label"));
  return [...document.querySelectorAll(".react-select__option")].map(
    (option) => option.textContent,
  );
};

const chips = () =>
  [...document.querySelectorAll(".tag-item")].map((chip) =>
    chip.textContent?.trim(),
  );

describe("ImageLabels", () => {
  it("shows the current labels as chips", () => {
    setup([ImageTypeEnum.CROP_FACE, ImageTypeEnum.VIEW_FRONT]);
    expect(chips()).toEqual(["Face", "Front"]);
  });

  it("shows chips in vocabulary order whatever order they were picked", () => {
    setup([
      ImageTypeEnum.DRESS_TOPLESS,
      ImageTypeEnum.VIEW_FRONT,
      ImageTypeEnum.CROP_FACE,
    ]);
    expect(chips()).toEqual(["Face", "Front", "Topless"]);
  });

  it("offers everything when nothing is chosen", async () => {
    const { user } = setup();
    const options = await offered(user);

    expect(options).toContain("FaceCollarbone up.");
    expect(options).toContain("Topless");
    expect(options).toContain("Back");
  });

  it("stops offering what a chosen label rules out", async () => {
    const { user } = setup([ImageTypeEnum.CROP_FACE]);
    const options = await offered(user);

    expect(options.join()).not.toContain("Topless");
    expect(options.join()).not.toContain("Back");
    // Only the conflicting values go, not their whole group
    expect(options.join()).toContain("Non-nude");
    expect(options.join()).toContain("Front");
  });

  it("blocks from the far side of a conflict too", async () => {
    const { user } = setup([ImageTypeEnum.DRESS_TOPLESS]);
    const options = await offered(user);

    expect(options.join()).not.toContain("Face");
    expect(options.join()).toContain("Three-quarter");
  });

  it("stops offering a group once it has an answer", async () => {
    const { user } = setup([ImageTypeEnum.VIEW_FRONT]);
    const options = await offered(user);

    expect(options.join()).not.toContain("Back");
    expect(options.join()).toContain("Face");
  });

  it("adds a label without disturbing the others", async () => {
    const { user, onChange } = setup([ImageTypeEnum.CROP_FACE]);

    await user.click(screen.getByLabelText("Add label"));
    await user.click(screen.getByText("Front"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ types: ["CROP_FACE", "VIEW_FRONT"] }),
    );
  });

  // We must not block an edit to a performer image labeled with an "outdated" label
  it("still shows a label switched off after assignment, and lets it go", async () => {
    const { user, onChange } = setup(
      [ImageTypeEnum.DRESS_TOPLESS],
      null,
      withToplessOff("type"),
    );
    expect(chips()).toEqual(["Topless"]);

    await user.click(document.querySelector(".tag-item button") as HTMLElement);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ types: [] }),
    );
  });

  for (const level of OFF_AT) {
    it(`stops offering a label switched off at the ${level}`, async () => {
      const { user } = setup([], null, withToplessOff(level));
      const options = await offered(user);

      expect(options.join()).not.toContain("Topless");
      expect(options.join().includes("Non-nude")).toBe(level === "type");
      expect(options.join()).toContain("Face");
    });
  }

  it("removes a label from its chip", async () => {
    const { user, onChange } = setup([
      ImageTypeEnum.CROP_FACE,
      ImageTypeEnum.VIEW_FRONT,
    ]);

    const remove = document.querySelectorAll(".tag-item button");
    await user.click(remove[0] as HTMLElement);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ types: ["VIEW_FRONT"] }),
    );
  });

  // Null rather than "", because the two mean different things to the server:
  // absent leaves the stored date alone, empty clears it
  it("reports a cleared date as null", async () => {
    const { user, onChange } = setup([], "2019");

    await user.clear(screen.getByLabelText("Image date"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ date: null }),
    );
  });
});
