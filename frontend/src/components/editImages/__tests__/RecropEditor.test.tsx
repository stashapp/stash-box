import { screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { largestCenteredRect } from "src/components/cropFrame";
import {
  type ImageFragment,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  ImageTypeGroupsDocument,
  type ImageTypeGroupsQuery,
  RecropImageDocument,
} from "src/graphql";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it, vi } from "vitest";

import RecropEditor from "../RecropEditor";

type Groups = ImageTypeGroupsQuery["imageTypeGroups"];

const image = (types: ImageTypeEnum[]): ImageFragment => ({
  __typename: "Image" as const,
  id: "img-1",
  url: "https://example.com/img-1.jpg",
  width: 800,
  height: 1200,
  types,
  date: null,
  organized: false,
});

const cropType = (key: ImageTypeEnum, name: string, aspectRatio: number) => ({
  __typename: "ImageType" as const,
  enabled: true,
  key,
  name,
  description: null,
  conflicts_with: [] as ImageTypeEnum[],
  crop_template: {
    __typename: "CropTemplate" as const,
    aspect_ratio: aspectRatio,
    guides: [],
  },
});

const groupsWithTemplate = (aspectRatio: number): Groups => [
  {
    __typename: "ImageTypeGroup" as const,
    enabled: true,
    key: ImageTypeGroupEnum.CROP,
    name: "Crop",
    description: null,
    types: [cropType(ImageTypeEnum.CROP_FACE, "Face", aspectRatio)],
  },
];

const vocabularyMock = (groups: Groups) => ({
  request: {
    query: ImageTypeGroupsDocument,
    variables: { includeDisabled: true },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { imageTypeGroups: groups } },
});

// What an untouched save of img-1 sends: the largest centred frame of the template's shape
const recropMock = (
  rect: ReturnType<typeof largestCenteredRect>,
  types = [ImageTypeEnum.CROP_FACE],
  date: string | null = null,
) => ({
  request: {
    query: RecropImageDocument,
    variables: {
      imageData: { image_id: "img-1", crop: rect, types, date },
    },
  },
  result: {
    data: {
      imageRecrop: {
        __typename: "Image" as const,
        id: "img-2",
        url: "https://example.com/img-2.jpg",
        width: 800,
        height: 800,
        types,
        date,
      },
    },
  },
});

type Mocks = NonNullable<
  NonNullable<Parameters<typeof renderForm>[1]>["mocks"]
>;

const setup = async (
  groups: Groups,
  props: Partial<ComponentProps<typeof RecropEditor>> = {},
  mocks: Mocks = [],
) => {
  const onRecropped = vi.fn();
  const onClose = vi.fn();
  const utils = renderForm(
    <RecropEditor
      image={image([ImageTypeEnum.CROP_FACE])}
      canAddAsNew
      onClose={onClose}
      onRecropped={onRecropped}
      {...props}
    />,
    { mocks: [vocabularyMock(groups), ...mocks] },
  );
  await screen.findByRole("button", { name: "Cancel" });
  return { ...utils, onRecropped, onClose };
};

const saved = (
  onRecropped: ReturnType<typeof vi.fn>,
  mock: ReturnType<typeof recropMock>,
  addAsNew: boolean,
) =>
  waitFor(() =>
    expect(onRecropped).toHaveBeenCalledWith(
      mock.result.data.imageRecrop,
      addAsNew,
    ),
  );

describe("RecropEditor", () => {
  it("draws the crop frame for the given image", async () => {
    await setup(groupsWithTemplate(1));
    expect(document.querySelector(".CropFrame")).not.toBeNull();
  });

  it("disables saving while the frame is the full picture", async () => {
    await setup(groupsWithTemplate(800 / 1200));
    expect(screen.getByRole("button", { name: "Save crop" })).toBeDisabled();
  });

  it("starts from the template the image is already labelled with", async () => {
    await setup(groupsWithTemplate(1));
    expect(screen.getByRole("button", { name: "Save crop" })).toBeEnabled();
  });

  it("offers the claimed template for download, as the upload form does", async () => {
    await setup(groupsWithTemplate(1));
    const link = screen.getByRole("link", { name: /download/i });
    expect(link).toHaveAttribute("href", "/crop-templates/CROP_FACE");
    expect(link).toHaveAttribute("download");
  });

  it("sends the image's current labels and date along with the crop", async () => {
    const rect = largestCenteredRect(1, 800 / 1200);
    // MockedProvider only resolves on an exact variables match
    const mock = recropMock(rect, [ImageTypeEnum.CROP_FACE], "2021-05");
    const { user, onRecropped } = await setup(
      groupsWithTemplate(1),
      { image: { ...image([ImageTypeEnum.CROP_FACE]), date: "2021-05" } },
      [mock],
    );

    await user.click(screen.getByRole("button", { name: "Save crop" }));

    await saved(onRecropped, mock, false);
  });

  describe("adding as new instead of replacing", () => {
    it("hides the choice when there is no room for another image", async () => {
      await setup(groupsWithTemplate(1), { canAddAsNew: false });
      expect(
        screen.queryByRole("checkbox", { name: "Add as a new image" }),
      ).not.toBeInTheDocument();
    });

    it("reports addAsNew once the checkbox is ticked", async () => {
      const mock = recropMock(largestCenteredRect(1, 800 / 1200));
      const { user, onRecropped } = await setup(groupsWithTemplate(1), {}, [
        mock,
      ]);

      await user.click(
        screen.getByRole("checkbox", { name: "Add as a new image" }),
      );
      await user.click(
        screen.getByRole("button", { name: "Save as new image" }),
      );

      await saved(onRecropped, mock, true);
    });

    it("drops the source's labels the chosen crop rules out", async () => {
      const face = groupsWithTemplate(1)[0];
      const groups: Groups = [
        {
          ...face,
          types: [
            { ...face.types[0], conflicts_with: [ImageTypeEnum.DRESS_TOPLESS] },
            cropType(ImageTypeEnum.CROP_TORSO, "Torso", 3 / 4),
          ],
        },
        {
          __typename: "ImageTypeGroup" as const,
          enabled: true,
          key: ImageTypeGroupEnum.DRESS,
          name: "State of dress",
          description: null,
          types: [
            {
              __typename: "ImageType" as const,
              enabled: true,
              key: ImageTypeEnum.DRESS_TOPLESS,
              name: "Topless",
              description: null,
              conflicts_with: [ImageTypeEnum.CROP_FACE],
              crop_template: null,
            },
          ],
        },
      ];
      const mock = recropMock(largestCenteredRect(1, 800 / 1200));
      const { user, onRecropped } = await setup(
        groups,
        {
          image: image([ImageTypeEnum.CROP_TORSO, ImageTypeEnum.DRESS_TOPLESS]),
        },
        [mock],
      );

      await user.click(
        screen.getByRole("checkbox", { name: "Add as a new image" }),
      );
      const picker = screen.getByRole("combobox", { name: "Crop" });
      expect(screen.getByRole("option", { name: "Face" })).toBeEnabled();
      await user.selectOptions(picker, ImageTypeEnum.CROP_FACE);
      await user.hover(picker);
      expect(await screen.findByText(/Without Topless/)).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "Save as new image" }),
      );

      await saved(onRecropped, mock, true);
    });

    it("lets a crop added as new claim a different crop type", async () => {
      const face = groupsWithTemplate(1)[0];
      const groups: Groups = [
        {
          ...face,
          types: [
            ...face.types,
            cropType(ImageTypeEnum.CROP_TORSO, "Torso", 3 / 4),
          ],
        },
      ];
      const mock = recropMock(largestCenteredRect(3 / 4, 800 / 1200), [
        ImageTypeEnum.CROP_TORSO,
      ]);
      const { user, onRecropped } = await setup(groups, {}, [mock]);

      expect(screen.queryByRole("combobox", { name: "Crop" })).toBeNull();
      await user.click(
        screen.getByRole("checkbox", { name: "Add as a new image" }),
      );
      await user.selectOptions(
        screen.getByRole("combobox", { name: "Crop" }),
        ImageTypeEnum.CROP_TORSO,
      );
      await user.click(
        screen.getByRole("button", { name: "Save as new image" }),
      );

      await saved(onRecropped, mock, true);
    });

    // An organized source's framing is vouched for, so a re-crop can only be added alongside
    it("offers no choice for an organized source: the crop is always added as new", async () => {
      const mock = recropMock(largestCenteredRect(1, 800 / 1200));
      const { user, onRecropped } = await setup(
        groupsWithTemplate(1),
        { addAsNewOnly: true },
        [mock],
      );

      expect(
        screen.queryByRole("checkbox", { name: "Add as a new image" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByText("Organized, so the crop is added as a new image"),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Save crop" }),
      ).not.toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "Save as new image" }),
      );

      await saved(onRecropped, mock, true);
    });
  });

  it("closes without saving on Cancel", async () => {
    const { user, onClose, onRecropped } = await setup(groupsWithTemplate(1));

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onRecropped).not.toHaveBeenCalled();
  });
});
