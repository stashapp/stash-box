import { screen, waitFor } from "@testing-library/react";
import { largestCenteredRect } from "src/components/cropFrame";
import {
  type ImageFragment,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  type ImageTypeGroupsQuery,
} from "src/graphql";
import RecropImageGQL from "src/graphql/mutations/RecropImage.gql";
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

const groupsWithTemplate = (aspectRatio: number): Groups => [
  {
    __typename: "ImageTypeGroup" as const,
    enabled: true,
    key: ImageTypeGroupEnum.CROP,
    name: "Crop",
    description: null,
    types: [
      {
        __typename: "ImageType" as const,
        enabled: true,
        key: ImageTypeEnum.CROP_FACE,
        name: "Face",
        description: null,
        conflicts_with: [],
        crop_template: {
          __typename: "CropTemplate" as const,
          aspect_ratio: aspectRatio,
          width: 1000,
          height: 1500,
          guides: [],
        },
      },
    ],
  },
];

// The crop of img-1 the tests below save: the frame starts out centered
// and matching the template's shape, so this is what an untouched save sends
const recropMock = (rect: ReturnType<typeof largestCenteredRect>) => ({
  request: {
    query: RecropImageGQL,
    variables: {
      imageData: {
        image_id: "img-1",
        crop: rect,
        types: [ImageTypeEnum.CROP_FACE],
        date: null,
      },
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
        types: [ImageTypeEnum.CROP_FACE],
        date: null,
      },
    },
  },
});

describe("RecropEditor", () => {
  it("draws the crop frame for the given image", () => {
    renderForm(
      <RecropEditor
        image={image([])}
        groups={[]}
        canAddAsNew
        onClose={vi.fn()}
        onRecropped={vi.fn()}
      />,
    );

    expect(document.querySelector(".CropFrame")).not.toBeNull();
  });

  it("disables saving until the frame is not the full picture", () => {
    renderForm(
      <RecropEditor
        image={image([])}
        groups={[]}
        canAddAsNew
        onClose={vi.fn()}
        onRecropped={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Save crop" })).toBeDisabled();
  });

  it("starts from the template the image is already labelled with", () => {
    renderForm(
      <RecropEditor
        image={image([ImageTypeEnum.CROP_FACE])}
        groups={groupsWithTemplate(1)}
        canAddAsNew
        onClose={vi.fn()}
        onRecropped={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Save crop" })).toBeEnabled();
  });

  it("offers the claimed template for download, as the upload form does", () => {
    renderForm(
      <RecropEditor
        image={image([ImageTypeEnum.CROP_FACE])}
        groups={groupsWithTemplate(1)}
        canAddAsNew
        onClose={vi.fn()}
        onRecropped={vi.fn()}
      />,
    );

    const link = screen.getByRole("link", { name: /download/i });
    expect(link).toHaveAttribute("href", "/crop-templates/CROP_FACE");
    expect(link).toHaveAttribute("download");
  });

  it("offers no template to download for an unlabelled source", () => {
    renderForm(
      <RecropEditor
        image={image([])}
        groups={groupsWithTemplate(1)}
        canAddAsNew
        onClose={vi.fn()}
        onRecropped={vi.fn()}
      />,
    );

    expect(screen.queryByRole("link", { name: /download/i })).toBeNull();
  });

  it("sends the image's current labels and date along with the crop", async () => {
    const rect = largestCenteredRect(1, 800 / 1200);
    const onRecropped = vi.fn();
    const { user } = renderForm(
      <RecropEditor
        image={{ ...image([ImageTypeEnum.CROP_FACE]), date: "2021-05" }}
        groups={groupsWithTemplate(1)}
        canAddAsNew
        onClose={vi.fn()}
        onRecropped={onRecropped}
      />,
      {
        mocks: [
          {
            // Proof the label/date actually rode along:
            // MockedProvider only resolves on an exact variables match
            request: {
              query: RecropImageGQL,
              variables: {
                imageData: {
                  image_id: "img-1",
                  crop: rect,
                  types: [ImageTypeEnum.CROP_FACE],
                  date: "2021-05",
                },
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
                  types: [ImageTypeEnum.CROP_FACE],
                  date: "2021-05",
                },
              },
            },
          },
        ],
      },
    );

    await user.click(screen.getByRole("button", { name: "Save crop" }));

    await waitFor(() =>
      expect(onRecropped).toHaveBeenCalledWith(
        expect.objectContaining({ id: "img-2" }),
        false,
      ),
    );
  });

  describe("adding as new instead of replacing", () => {
    it("hides the choice when there is no room for another image", () => {
      renderForm(
        <RecropEditor
          image={image([])}
          groups={[]}
          canAddAsNew={false}
          onClose={vi.fn()}
          onRecropped={vi.fn()}
        />,
      );

      expect(
        screen.queryByRole("checkbox", { name: "Add as a new image" }),
      ).not.toBeInTheDocument();
    });

    it("reports addAsNew once the checkbox is ticked", async () => {
      const rect = largestCenteredRect(1, 800 / 1200);
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={image([ImageTypeEnum.CROP_FACE])}
          groups={groupsWithTemplate(1)}
          canAddAsNew
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
        { mocks: [recropMock(rect)] },
      );

      await user.click(
        screen.getByRole("checkbox", { name: "Add as a new image" }),
      );
      await user.click(
        screen.getByRole("button", { name: "Save as new image" }),
      );

      await waitFor(() =>
        expect(onRecropped).toHaveBeenCalledWith(
          expect.objectContaining({ id: "img-2" }),
          true,
        ),
      );
    });

    it("drops the source's labels the chosen crop rules out", async () => {
      const face = groupsWithTemplate(1)[0];
      const groups: Groups = [
        {
          ...face,
          types: [
            { ...face.types[0], conflicts_with: [ImageTypeEnum.DRESS_TOPLESS] },
            {
              __typename: "ImageType" as const,
              enabled: true,
              key: ImageTypeEnum.CROP_TORSO,
              name: "Torso",
              description: null,
              conflicts_with: [],
              crop_template: {
                __typename: "CropTemplate" as const,
                aspect_ratio: 3 / 4,
                width: 800,
                height: 1067,
                guides: [],
              },
            },
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
      const rect = largestCenteredRect(1, 800 / 1200);
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={image([ImageTypeEnum.CROP_TORSO, ImageTypeEnum.DRESS_TOPLESS])}
          groups={groups}
          canAddAsNew
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
        { mocks: [recropMock(rect)] },
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

      await waitFor(() =>
        expect(onRecropped).toHaveBeenCalledWith(
          expect.objectContaining({ id: "img-2" }),
          true,
        ),
      );
    });

    it("lets a crop added as new claim a different crop type", async () => {
      const face = groupsWithTemplate(1)[0];
      const groups: Groups = [
        {
          ...face,
          types: [
            ...face.types,
            {
              __typename: "ImageType" as const,
              enabled: true,
              key: ImageTypeEnum.CROP_TORSO,
              name: "Torso",
              description: null,
              conflicts_with: [],
              crop_template: {
                __typename: "CropTemplate" as const,
                aspect_ratio: 3 / 4,
                width: 800,
                height: 1067,
                guides: [],
              },
            },
          ],
        },
      ];
      const rect = largestCenteredRect(3 / 4, 800 / 1200);
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={image([ImageTypeEnum.CROP_FACE])}
          groups={groups}
          canAddAsNew
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
        {
          mocks: [
            {
              ...recropMock(rect),
              request: {
                query: RecropImageGQL,
                variables: {
                  imageData: {
                    image_id: "img-1",
                    crop: rect,
                    types: [ImageTypeEnum.CROP_TORSO],
                    date: null,
                  },
                },
              },
            },
          ],
        },
      );

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

      await waitFor(() =>
        expect(onRecropped).toHaveBeenCalledWith(
          expect.objectContaining({ id: "img-2" }),
          true,
        ),
      );
    });

    // An organized source has a framing a moderator vouched for, so the only re-crop on offer is one that leaves it in place
    it("offers no choice for an organized source: the crop is always added as new", async () => {
      const rect = largestCenteredRect(1, 800 / 1200);
      const onRecropped = vi.fn();
      const { user } = renderForm(
        <RecropEditor
          image={{ ...image([ImageTypeEnum.CROP_FACE]), organized: true }}
          groups={groupsWithTemplate(1)}
          canAddAsNew
          addAsNewOnly
          onClose={vi.fn()}
          onRecropped={onRecropped}
        />,
        { mocks: [recropMock(rect)] },
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

      await waitFor(() =>
        expect(onRecropped).toHaveBeenCalledWith(
          expect.objectContaining({ id: "img-2" }),
          true,
        ),
      );
    });
  });

  it("closes without saving on Cancel", async () => {
    const onClose = vi.fn();
    const { user } = renderForm(
      <RecropEditor
        image={image([])}
        groups={[]}
        canAddAsNew
        onClose={onClose}
        onRecropped={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
