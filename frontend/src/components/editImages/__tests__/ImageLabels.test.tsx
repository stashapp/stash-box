import { screen, within } from "@testing-library/react";
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

// Every offered option's visible label text, across every group's fieldset
// -- "offered" meaning rendered as a choice at all, selectable or not.
// jsdom does not compute accessibleName the way a real browser does, so
// this reads the wrapping <label>'s text directly instead.
const offered = () =>
  screen
    .getAllByRole("radio")
    .map((radio) => radio.closest("label")?.textContent?.trim());

const groupFieldset = (name: string) => screen.getByRole("group", { name });

describe("ImageLabels", () => {
  it("shows the current labels as the checked radio in their group", () => {
    setup([ImageTypeEnum.CROP_FACE, ImageTypeEnum.VIEW_FRONT]);

    expect(within(groupFieldset("Crop")).getByLabelText("Face")).toBeChecked();
    expect(within(groupFieldset("Pose")).getByLabelText("Front")).toBeChecked();
    expect(
      within(groupFieldset("State of dress")).getByLabelText("None"),
    ).toBeChecked();
  });

  it("shows the selected option's description below its picker, visibly", () => {
    setup([ImageTypeEnum.CROP_FACE]);

    expect(
      within(groupFieldset("Crop")).getByText("Collarbone up."),
    ).toBeInTheDocument();
    // Nothing picked in Pose, so nothing to describe there.
    expect(
      groupFieldset("Pose").querySelector(
        ".EditImages-labels-group-description",
      ),
    ).toBeNull();
  });

  it("offers every option in every group when nothing is chosen", () => {
    setup();
    const options = offered();

    expect(options).toContain("Face");
    expect(options).toContain("Topless");
    expect(options).toContain("Back");
    // One None per group, alongside the real choices
    expect(options.filter((name) => name === "None")).toHaveLength(3);
  });

  it("still offers everything, just disabled, once a chosen label rules some out", () => {
    setup([ImageTypeEnum.CROP_FACE]);

    const topless = within(groupFieldset("State of dress")).getByLabelText(
      "Topless",
    );
    const back = within(groupFieldset("Pose")).getByLabelText("Back");
    expect(topless).toBeDisabled();
    expect(back).toBeDisabled();

    // Only the conflicting values, not their whole group
    expect(
      within(groupFieldset("State of dress")).getByLabelText("Non-nude"),
    ).toBeEnabled();
    expect(within(groupFieldset("Pose")).getByLabelText("Front")).toBeEnabled();
  });

  it("blocks from the far side of a conflict too", () => {
    setup([ImageTypeEnum.DRESS_TOPLESS]);

    expect(within(groupFieldset("Crop")).getByLabelText("Face")).toBeDisabled();
    expect(
      within(groupFieldset("Crop")).getByLabelText("Three-quarter"),
    ).toBeEnabled();
  });

  it("lets a group's answer be switched directly, without clearing first", async () => {
    const { user, onChange } = setup([ImageTypeEnum.CROP_FACE]);

    await user.click(
      within(groupFieldset("Crop")).getByLabelText("Three-quarter"),
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ types: ["CROP_THREE_QUARTER"] }),
    );
  });

  it("adds a label in a different group without disturbing the others", async () => {
    const { user, onChange } = setup([ImageTypeEnum.CROP_FACE]);

    await user.click(within(groupFieldset("Pose")).getByLabelText("Front"));

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
    const dress = groupFieldset("State of dress");
    expect(within(dress).getByLabelText("Topless")).toBeChecked();

    await user.click(within(dress).getByLabelText("None"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ types: [] }),
    );
  });

  for (const level of OFF_AT) {
    it(`stops offering a label switched off at the ${level}`, () => {
      setup([], null, withToplessOff(level));
      const options = offered();

      expect(options).not.toContain("Topless");
      expect(options.includes("Non-nude")).toBe(level === "type");
      expect(options).toContain("Face");
    });
  }

  it("clears a group's label by choosing None", async () => {
    const { user, onChange } = setup([
      ImageTypeEnum.CROP_FACE,
      ImageTypeEnum.VIEW_FRONT,
    ]);

    await user.click(within(groupFieldset("Crop")).getByLabelText("None"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ types: ["VIEW_FRONT"] }),
    );
  });

  it("explains that None is a legitimate choice, not a placeholder", () => {
    setup();

    expect(
      within(groupFieldset("Crop")).getByLabelText("None").closest("label"),
    ).toHaveAttribute("title", "It's always valid to leave an image unlabeled");
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

  // Flagging a date invalid while it is still being typed would fire on
  // every keystroke of an in-progress entry, which is not yet wrong so much
  // as unfinished
  describe("date validation", () => {
    const invalid = () => screen.queryByText(/invalid date/i);

    it("says nothing about an invalid date while the field is focused", async () => {
      const { user } = setup([], "not-a-date");

      await user.click(screen.getByLabelText("Image date"));
      expect(invalid()).toBeNull();
    });

    it("shows it once the field is left, and hides it again on refocus", async () => {
      const { user } = setup([], "not-a-date");
      const field = screen.getByLabelText("Image date");

      await user.click(field);
      await user.tab();
      expect(invalid()).not.toBeNull();

      await user.click(field);
      expect(invalid()).toBeNull();
    });
  });

  // MODERATE is required to touch any of this once labelsDisabled is set --
  // nothing here would actually respond to a click, so nothing here is
  // rendered as if it would.
  describe("labelsDisabled", () => {
    const setupDisabled = (types: ImageTypeEnum[]) => {
      const onChange = vi.fn();
      const value = { image: IMAGE, types, date: null } as TypedImage;
      const utils = renderForm(
        <ImageLabels
          groups={GROUPS}
          value={value}
          onChange={onChange}
          labelsDisabled
        />,
      );
      return { ...utils, onChange };
    };

    it("shows a plain readout instead of radios, for groups that have a value", () => {
      setupDisabled([ImageTypeEnum.CROP_FACE, ImageTypeEnum.VIEW_FRONT]);

      expect(screen.queryAllByRole("radio")).toHaveLength(0);
      const summary = document.querySelector(
        ".EditImages-labels-summary",
      )?.textContent;
      expect(summary).toContain("Crop:");
      expect(summary).toContain("Face");
      expect(summary).toContain("Pose:");
      expect(summary).toContain("Front");
      // Never answered, so nothing to read out for it either.
      expect(summary).not.toContain("State of dress");
    });

    it("leaves the date field interactive -- labelsDisabled is about types only", async () => {
      const { user, onChange } = setupDisabled([]);

      const date = screen.getByLabelText("Image date");
      expect(date).toBeEnabled();

      await user.type(date, "2021");
      expect(onChange).toHaveBeenCalled();
    });
  });

  // The independent flag, gated by a separate role check (see editImages.tsx)
  // -- disabled here says nothing about labelsDisabled, same as the reverse
  // above.
  describe("dateDisabled", () => {
    const setupDateDisabled = (date: string | null) => {
      const onChange = vi.fn();
      const value = { image: IMAGE, types: [], date } as TypedImage;
      const utils = renderForm(
        <ImageLabels
          groups={GROUPS}
          value={value}
          onChange={onChange}
          dateDisabled
        />,
      );
      return { ...utils, onChange };
    };

    it("shows the date as plain text instead of a field", () => {
      setupDateDisabled("2019-06");

      expect(screen.queryByLabelText("Image date")).toBeNull();
      expect(
        document.querySelector(".EditImages-labels-summary")?.textContent,
      ).toContain("2019-06");
    });

    it("shows nothing where there is no date to read out", () => {
      setupDateDisabled(null);

      expect(
        document.querySelector(".EditImages-labels-summary")?.textContent,
      ).toBe("");
    });
  });
});
