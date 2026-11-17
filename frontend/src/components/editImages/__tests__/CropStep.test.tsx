import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { largestCenteredRect } from "src/components/cropFrame";
import {
  CropGuideAxisEnum,
  CropGuideRoleEnum,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  type ImageTypeGroupsQuery,
} from "src/graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";

import CropStep from "../CropStep";

type Groups = ImageTypeGroupsQuery["imageTypeGroups"];

const template = (aspectRatio: number) => ({
  __typename: "CropTemplate" as const,
  aspect_ratio: aspectRatio,
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

const uploadButton = () =>
  screen.getByRole("button", { name: /^(Crop and upload|Upload)$/ });
const upload = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(uploadButton());
const reset = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Reset" }));

const setup = (onUpload = vi.fn()) => {
  const utils = render(
    <CropStep
      file={file()}
      groups={GROUPS}
      uploading={false}
      onRemove={vi.fn()}
      onUpload={onUpload}
    />,
  );
  const crops = () =>
    screen.queryByRole("button", { name: "Crop and upload" }) !== null;
  const dateValid = () => !(uploadButton() as HTMLButtonElement).disabled;
  return {
    ...utils,
    onUpload,
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
  it("draws no frame until a crop is chosen", async () => {
    const { user, crops } = setup();
    await ready();

    expect(crops()).toBe(false);
    expect(frame()).toBeNull();
    expect(screen.queryByRole("button", { name: "Resize se" })).toBeNull();

    await chooseLabel(user, "Face");

    await waitFor(() => expect(frame()).not.toBeNull());
    expect(crops()).toBe(true);
    expect(
      screen.getByRole("button", { name: "Resize se" }),
    ).toBeInTheDocument();
  });

  it("draws no frame for a crop with no template", async () => {
    const { user } = setup();
    await ready();

    await chooseLabel(user, "Torso");

    expect(frame()).toBeNull();
  });

  it("sends the frame and the type together", async () => {
    const { onUpload, user } = setup();
    await ready();

    await chooseLabel(user, "Face");
    await upload(user);

    expect(onUpload).toHaveBeenCalledWith(
      largestCenteredRect(2 / 3, 1),
      [ImageTypeEnum.CROP_FACE],
      null,
    );
  });

  // Rendered separately so each measurement is free of the other's frame
  it("shapes the frame to the chosen template", async () => {
    const cropWith = async (name: string) => {
      const { onUpload, user, unmount } = setup();
      await ready();
      await chooseLabel(user, name);
      await upload(user);
      unmount();
      return onUpload.mock.calls[0][0];
    };

    expect(await cropWith("Face")).toEqual(largestCenteredRect(2 / 3, 1));
    expect(await cropWith("Wide")).toEqual(largestCenteredRect(16 / 9, 1));
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
    const { onUpload, crops, user } = setup();
    await ready();

    await chooseLabel(user, "Face");
    expect(crops()).toBe(true);

    await reset(user);

    expect(crops()).toBe(false);
    await waitFor(() => expect(frame()).toBeNull());

    await upload(user);
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
    const { onUpload, user } = setup();
    await ready();

    await chooseLabel(user, "Front");
    await chooseLabel(user, "Face");
    await reset(user);
    await upload(user);

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
    const { onUpload, user } = setup();
    await ready();

    const dateField = await screen.findByLabelText("Image date");
    await user.type(dateField, "2099-01-01");
    dateField.blur();

    await upload(user);

    expect(onUpload).not.toHaveBeenCalled();
  });
});

describe("CropStep on a picture already the right shape", () => {
  beforeEach(() => {
    bitmap = { width: 200, height: 300 };
  });

  it("labels without cropping when the frame cuts nothing", async () => {
    const { onUpload, crops, user } = setup();
    await ready();

    await chooseLabel(user, "Face");

    expect(crops()).toBe(false);
    await upload(user);

    expect(onUpload).toHaveBeenCalledWith(
      undefined,
      [ImageTypeEnum.CROP_FACE],
      null,
    );
  });
});

describe("CropStep layout stability", () => {
  it("keeps the one toolbar row, offering rotation only once a crop is chosen", async () => {
    const { user } = setup();
    await ready();

    const toolbarRows = () =>
      document.querySelectorAll(".CropFrame-toolbar").length;
    const rotateButton = () =>
      screen.queryByRole("button", { name: "Reset rotation" });

    expect(toolbarRows()).toBe(1);
    expect(rotateButton()).toBeNull();

    await chooseLabel(user, "Face");

    await waitFor(() => expect(rotateButton()).not.toBeNull());
    expect(toolbarRows()).toBe(1);
  });
});

describe("CropStep with nothing to crop to", () => {
  it("previews the file as it is and uploads it uncropped and unlabelled", async () => {
    const onUpload = vi.fn();
    render(
      <CropStep
        file={file()}
        groups={[]}
        uploading={false}
        onRemove={vi.fn()}
        onUpload={onUpload}
      />,
    );

    await waitFor(() =>
      expect(document.querySelector(".CropStep-preview img")).not.toBeNull(),
    );
    expect(document.querySelector(".CropFrame")).toBeNull();
    expect(screen.queryByRole("button", { name: "Zoom in" })).toBeNull();
    expect(screen.queryByRole("radio")).toBeNull();
    expect(document.querySelector(".CropStep-roomy")).toBeNull();

    await upload(userEvent.setup());

    expect(onUpload).toHaveBeenCalledWith(undefined, [], null);
  });
});
