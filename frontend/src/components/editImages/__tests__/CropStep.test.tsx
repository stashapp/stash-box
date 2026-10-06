import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import {
  CropGuideAxisEnum,
  CropGuideRoleEnum,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  type ImageTypeGroupsQuery,
} from "src/graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CropStep, { type CropStepHandle } from "../CropStep";

type Groups = ImageTypeGroupsQuery["imageTypeGroups"];

const template = (aspectRatio: number) => ({
  __typename: "CropTemplate" as const,
  aspect_ratio: aspectRatio,
  width: 1000,
  height: 1500,
  guides: [
    {
      __typename: "CropGuide" as const,
      axis: CropGuideAxisEnum.Y,
      position: 0.425,
      role: CropGuideRoleEnum.ANCHOR,
      label: "Bisects the eyes",
    },
  ],
});

// A crop group where two types have templates and one does not,
// plus a group describing the subject rather than the frame
const GROUPS: Groups = [
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
        conflicts_with: [],
        crop_template: template(2 / 3),
      },
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.CROP_WIDE,
        name: "Wide",
        description: "Subject horizontal.",
        conflicts_with: [],
        crop_template: template(16 / 9),
      },
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.CROP_TORSO,
        name: "Torso",
        description: "Hips to shoulders.",
        conflicts_with: [],
        crop_template: null,
      },
    ],
  },
  {
    __typename: "ImageTypeGroup" as const,
    enabled: true,
    key: ImageTypeGroupEnum.VIEW,
    name: "Pose",
    description: "Which way is the subject facing?",
    types: [
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.VIEW_FRONT,
        name: "Front",
        description: null,
        conflicts_with: [],
        crop_template: null,
      },
    ],
  },
];

const file = () => new File(["pixels"], "photo.jpg", { type: "image/jpeg" });

let bitmap = { width: 300, height: 300 };
vi.stubGlobal("createImageBitmap", () =>
  Promise.resolve({ ...bitmap, close: () => {} }),
);
beforeEach(() => {
  bitmap = { width: 300, height: 300 };
});

const setup = (onUpload = vi.fn()) => {
  const ref = createRef<CropStepHandle>();
  const onCropsChange = vi.fn();
  const onDateValidChange = vi.fn();
  const utils = render(
    <CropStep
      ref={ref}
      file={file()}
      groups={GROUPS}
      onCropsChange={onCropsChange}
      onDateValidChange={onDateValidChange}
      onUpload={onUpload}
    />,
  );
  const crops = () => onCropsChange.mock.calls.at(-1)?.[0] as boolean;
  const dateValid = () => onDateValidChange.mock.calls.at(-1)?.[0] as boolean;
  return {
    ...utils,
    ref,
    onUpload,
    onCropsChange,
    onDateValidChange,
    crops,
    dateValid,
    user: userEvent.setup(),
  };
};

const ready = () => screen.findByLabelText("Face");

const chooseLabel = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  await user.click(await screen.findByLabelText(name));
};

const frame = () => document.querySelector(".CropFrame-frame");

describe("CropStep", () => {
  // Base case: existing behavior is preserved until a label is added and a crop is possible
  it("reports no crop until something is cropped", async () => {
    const { crops } = setup();
    await ready();

    expect(crops()).toBe(false);
  });

  it("draws no frame until a crop is chosen", async () => {
    const { user } = setup();
    await ready();

    expect(frame()).toBeNull();
    expect(screen.queryByRole("button", { name: "Resize se" })).toBeNull();

    await chooseLabel(user, "Face");

    await waitFor(() => expect(frame()).not.toBeNull());
    expect(
      screen.getByRole("button", { name: "Resize se" }),
    ).toBeInTheDocument();
  });

  // A crop the instance has no template for is a label and nothing more
  it("draws no frame for a crop with no template", async () => {
    const { user } = setup();
    await ready();

    await chooseLabel(user, "Torso");

    expect(frame()).toBeNull();
  });

  // The whole point: the frame and the label are chosen in one action, so the
  // type describes what was done rather than being a judgement made later
  it("sends the frame and the type together", async () => {
    const { ref, onUpload, crops, user } = setup();
    await ready();

    await chooseLabel(user, "Face");
    expect(crops()).toBe(true);
    ref.current?.upload();

    expect(onUpload).toHaveBeenCalledTimes(1);
    const [crop, types] = onUpload.mock.calls[0];
    expect(types).toContain(ImageTypeEnum.CROP_FACE);
    expect(crop).toMatchObject({ angle: 0 });
    expect(crop.width).toBeGreaterThan(0);
  });

  it("shapes the frame to the chosen template", async () => {
    // A square picture, so both templates crop something. Rendered
    // separately rather than switched between, just to keep each
    // measurement free of whatever frame the other one left behind
    const imageAspect = 1;

    const cropWith = async (name: string) => {
      const { ref, onUpload, user, unmount } = setup();
      await ready();
      await chooseLabel(user, name);
      ref.current?.upload();
      const crop = onUpload.mock.calls[0][0];
      unmount();
      return crop;
    };

    const portrait = await cropWith("Face");
    expect((portrait.width * imageAspect) / portrait.height).toBeCloseTo(2 / 3);

    const landscape = await cropWith("Wide");
    expect((landscape.width * imageAspect) / landscape.height).toBeCloseTo(
      16 / 9,
    );

    expect(portrait.height).toBeGreaterThan(landscape.height);
  });

  it("draws the template's guides over the frame", async () => {
    const { user } = setup();
    await ready();

    expect(document.querySelectorAll(".CropOverlay-guide")).toHaveLength(0);

    await chooseLabel(user, "Face");

    await waitFor(() =>
      expect(document.querySelectorAll(".CropOverlay-guide")).toHaveLength(1),
    );
    expect(screen.getByText("Bisects the eyes")).toBeInTheDocument();
  });

  it("offers the chosen template for download", async () => {
    const { user } = setup();
    await ready();

    expect(screen.queryByRole("link", { name: /download/i })).toBeNull();

    await chooseLabel(user, "Face");

    const link = screen.getByRole("link", { name: /download/i });
    expect(link).toHaveAttribute("href", "/crop-templates/CROP_FACE");
    expect(link).toHaveAttribute("download");
  });

  it("resets back to the untouched file", async () => {
    const { ref, onUpload, crops, user } = setup();
    await ready();

    await chooseLabel(user, "Face");
    expect(crops()).toBe(true);

    act(() => ref.current?.reset());

    expect(crops()).toBe(false);
    await waitFor(() => expect(frame()).toBeNull());

    ref.current?.upload();
    expect(onUpload).toHaveBeenCalledWith(undefined, [], null);
  });

  it("resets a manually adjusted frame when the label switches to a different template", async () => {
    const { user } = setup();
    await ready();

    await chooseLabel(user, "Face");
    await waitFor(() => expect(frame()).not.toBeNull());

    const grip = screen.getByLabelText("Crop frame, arrow keys to move");
    grip.focus();
    const before = (frame() as HTMLElement).style.left;
    await user.keyboard("{ArrowRight}");
    const nudged = (frame() as HTMLElement).style.left;
    expect(nudged).not.toBe(before);

    await chooseLabel(user, "Wide");

    await waitFor(() => expect(frame()).not.toBeNull());
    expect((frame() as HTMLElement).style.left).not.toBe(nudged);
  });

  it("keeps the other labels through a reset", async () => {
    const { ref, onUpload, user } = setup();
    await ready();

    await chooseLabel(user, "Front");
    await chooseLabel(user, "Face");
    act(() => ref.current?.reset());
    ref.current?.upload();

    expect(onUpload).toHaveBeenCalledWith(
      undefined,
      [ImageTypeEnum.VIEW_FRONT],
      null,
    );
  });
});

describe("CropStep date validity", () => {
  it("reports the date invalid once it is out of range", async () => {
    const { user, dateValid } = setup();
    await ready();

    const dateField = await screen.findByLabelText("Image date");
    await user.type(dateField, "2099-01-01");
    dateField.blur();

    await waitFor(() => expect(dateValid()).toBe(false));
  });

  it("refuses to upload while the date is out of range", async () => {
    const { ref, onUpload, user } = setup();
    await ready();

    const dateField = await screen.findByLabelText("Image date");
    await user.type(dateField, "2099-01-01");
    dateField.blur();

    ref.current?.upload();

    expect(onUpload).not.toHaveBeenCalled();
  });
});

describe("CropStep on a picture already the right shape", () => {
  beforeEach(() => {
    bitmap = { width: 200, height: 300 };
  });

  it("labels without cropping when the frame cuts nothing", async () => {
    const { ref, onUpload, crops, user } = setup();
    await ready();

    await chooseLabel(user, "Face");

    expect(crops()).toBe(false);
    ref.current?.upload();

    expect(onUpload).toHaveBeenCalledWith(
      undefined,
      [ImageTypeEnum.CROP_FACE],
      null,
    );
  });
});

describe("CropStep layout stability", () => {
  it("keeps the same toolbar row before and after a crop is chosen", async () => {
    const { user } = setup();
    await ready();

    const toolbarRows = () =>
      document.querySelectorAll(".CropFrame-toolbar").length;

    expect(toolbarRows()).toBe(1);

    await chooseLabel(user, "Face");
    await waitFor(() => expect(frame()).not.toBeNull());

    expect(toolbarRows()).toBe(1);
  });

  it("only offers the rotate button once a crop is chosen", async () => {
    const { user } = setup();
    await ready();

    const rotateButton = () =>
      screen.queryByRole("button", { name: "Reset rotation" });
    expect(rotateButton()).toBeNull();

    await chooseLabel(user, "Face");

    await waitFor(() => expect(rotateButton()).not.toBeNull());
  });
});

describe("CropStep with nothing to crop to", () => {
  it("previews the file as it is, with no frame, toolbar or room for one", async () => {
    render(<CropStep file={file()} groups={[]} onUpload={vi.fn()} />);

    await waitFor(() =>
      expect(document.querySelector(".CropStep-preview img")).not.toBeNull(),
    );
    expect(document.querySelector(".CropFrame")).toBeNull();
    expect(screen.queryByRole("button", { name: "Zoom in" })).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(document.querySelector(".CropStep-roomy")).toBeNull();
  });

  it("uploads the file uncropped and unlabelled", async () => {
    const ref = createRef<CropStepHandle>();
    const onUpload = vi.fn();
    render(
      <CropStep ref={ref} file={file()} groups={[]} onUpload={onUpload} />,
    );

    await waitFor(() =>
      expect(document.querySelector(".CropStep-preview img")).not.toBeNull(),
    );
    ref.current?.upload();

    expect(onUpload).toHaveBeenCalledWith(undefined, [], null);
  });
});
