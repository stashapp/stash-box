import { screen, within } from "@testing-library/react";
import { renderForm } from "lib/test/render";
import {
  ImageTypeEnum,
  ImageTypeGroupEnum,
  type ImageTypeGroupsQuery,
} from "src/graphql";
import { describe, expect, it, vi } from "vitest";

import ImageCategorizationFields from "../ImageCategorizationFields";
import type { ImageCategorization } from "../types";

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

const setup = (
  types: ImageTypeEnum[] = [],
  date: string | null = null,
  groups: ImageTypeGroupsQuery["imageTypeGroups"] = GROUPS,
) => {
  const onChange = vi.fn();
  const value = {
    types,
    date: date,
  } satisfies ImageCategorization;
  const utils = renderForm(
    <ImageCategorizationFields
      groups={groups}
      value={value}
      onChange={onChange}
    />,
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

// Every offered option's visible label text, across every group's fieldset:
// jsdom does not compute accessibleName the way a real browser does, so
// this reads the wrapping <label>'s text directly instead.
const offered = () =>
  screen
    .getAllByRole("radio")
    .map((radio) => radio.closest("label")?.textContent?.trim());

const groupFieldset = (name: string) => screen.getByRole("group", { name });

describe("ImageCategorizationFields", () => {
  it("shows the current labels as the checked radio in their group", () => {
    setup([ImageTypeEnum.CROP_FACE, ImageTypeEnum.VIEW_FRONT]);

    expect(within(groupFieldset("Crop")).getByLabelText("Face")).toBeChecked();
    expect(within(groupFieldset("Pose")).getByLabelText("Front")).toBeChecked();
    expect(
      within(groupFieldset("State of dress")).getByLabelText("None"),
    ).toBeChecked();
  });

  it("describes an option on hover, not in the card", async () => {
    const { user } = setup([ImageTypeEnum.CROP_FACE]);

    expect(screen.queryByText("Collarbone up.")).toBeNull();
    await user.hover(within(groupFieldset("Crop")).getByText("Face"));
    expect(await screen.findByText("Collarbone up.")).toBeInTheDocument();
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

  it("says which chosen label blocks an option, on hover", async () => {
    const { user } = setup([ImageTypeEnum.CROP_FACE]);

    await user.hover(
      within(groupFieldset("State of dress")).getByText("Topless"),
    );

    expect(
      await screen.findByText('Conflicts with "Face"'),
    ).toBeInTheDocument();
  });

  it("blocks from the far side of a conflict too", () => {
    setup([ImageTypeEnum.DRESS_TOPLESS]);

    expect(within(groupFieldset("Crop")).getByLabelText("Face")).toBeDisabled();
    expect(
      within(groupFieldset("Crop")).getByLabelText("Three-quarter"),
    ).toBeEnabled();
  });

  it("switches a group’s answer without changing the date", async () => {
    const { user, onChange } = setup([ImageTypeEnum.CROP_FACE], "2019");

    await user.click(
      within(groupFieldset("Crop")).getByLabelText("Three-quarter"),
    );

    expect(onChange).toHaveBeenCalledWith({
      types: [ImageTypeEnum.CROP_THREE_QUARTER],
      date: "2019",
    });
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

  it("clears the date without changing classification", async () => {
    const { user, onChange } = setup([ImageTypeEnum.CROP_FACE], "2019");

    await user.clear(screen.getByLabelText("Image date"));

    expect(onChange).toHaveBeenCalledWith({
      types: [ImageTypeEnum.CROP_FACE],
      date: null,
    });
  });

  // Flagging a date invalid while it is still being typed would fire on every keystroke
  // of an in-progress entry, which is not yet wrong so much as unfinished
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

  describe("read-only classification", () => {
    const setupReadOnly = (types: ImageTypeEnum[]) => {
      const onChange = vi.fn();
      const value = { types, date: null } satisfies ImageCategorization;
      const utils = renderForm(
        <ImageCategorizationFields
          groups={GROUPS}
          value={value}
          onChange={onChange}
          readOnly
        />,
      );
      return { ...utils, onChange };
    };

    it("shows a readout with None for unlabelled groups instead of radios", () => {
      setupReadOnly([ImageTypeEnum.CROP_FACE, ImageTypeEnum.VIEW_FRONT]);

      expect(screen.queryAllByRole("radio")).toHaveLength(0);
      const summary = document.querySelector(
        ".ImageCategorizationFields-summary",
      )?.textContent;
      expect(summary).toContain("Crop:");
      expect(summary).toContain("Face");
      expect(summary).toContain("Pose:");
      expect(summary).toContain("Front");
      expect(summary).toContain("State of dress: None");
    });

    it("shows None for each group when nothing is labelled", () => {
      setupReadOnly([]);

      expect(screen.getByText("Classification")).toBeInTheDocument();
      expect(screen.queryAllByRole("radio")).toHaveLength(0);
      const summary = document.querySelector(
        ".ImageCategorizationFields-summary",
      );
      expect(summary).toHaveTextContent("Crop: None");
      expect(summary).toHaveTextContent("Pose: None");
      expect(summary).toHaveTextContent("State of dress: None");
    });

    it("also makes the date read-only", () => {
      const { onChange } = setupReadOnly([]);

      expect(screen.queryByLabelText("Image date")).toBeNull();
      expect(screen.queryAllByRole("textbox")).toHaveLength(0);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("read-only date", () => {
    const setupReadOnlyDate = (date: string | null) => {
      const onChange = vi.fn();
      const value = { types: [], date } satisfies ImageCategorization;
      const utils = renderForm(
        <ImageCategorizationFields
          groups={GROUPS}
          value={value}
          onChange={onChange}
          readOnly
        />,
      );
      return { ...utils, onChange };
    };

    it("shows the date as plain text instead of a field", () => {
      setupReadOnlyDate("2019-06");

      expect(screen.queryByLabelText("Image date")).toBeNull();
      expect(screen.getByText("2019-06")).toBeInTheDocument();
    });

    it("omits the card entirely when there is no date to read out", () => {
      setupReadOnlyDate(null);

      expect(screen.queryByText("Approximate date")).toBeNull();
    });
  });
});
