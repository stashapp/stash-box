import { useLens } from "@hookform/lenses";
import { screen, waitFor } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { type FC, useState } from "react";
import { useForm } from "react-hook-form";
import { largestCenteredRect } from "src/components/cropFrame";
import {
  CropGuideAxisEnum,
  CropGuideRoleEnum,
  ImageCategorizationDocument,
  type ImageFragment,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  ImageTypeGroupsDocument,
  ImageTypeScopeEnum,
  RecropImageDocument,
  RoleEnum,
} from "src/graphql";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it, vi } from "vitest";

import EditImages from "../editImages";

const guides = [
  {
    __typename: "CropGuide" as const,
    axis: CropGuideAxisEnum.Y,
    position: 0.425,
    role: CropGuideRoleEnum.ANCHOR,
    label: "Bisects the eyes",
  },
  {
    __typename: "CropGuide" as const,
    axis: CropGuideAxisEnum.X,
    position: 0.5,
    role: CropGuideRoleEnum.REFERENCE,
    label: "Centre",
  },
];

const vocabularyMock = {
  request: {
    query: ImageTypeGroupsDocument,
    variables: {
      target: ImageTypeScopeEnum.PERFORMER,
      includeDisabled: true,
    },
  },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      imageTypeGroups: [
        {
          __typename: "ImageTypeGroup" as const,
          key: ImageTypeGroupEnum.CROP,
          name: "Crop",
          description: null,
          enabled: true,
          types: [
            {
              __typename: "ImageType" as const,
              key: ImageTypeEnum.CROP_FACE,
              name: "Face",
              description: null,
              enabled: true,
              conflicts_with: [],
              crop_template: {
                __typename: "CropTemplate" as const,
                aspect_ratio: 2 / 3,
                guides,
              },
            },
            {
              __typename: "ImageType" as const,
              key: ImageTypeEnum.CROP_TORSO,
              name: "Torso",
              description: null,
              enabled: true,
              conflicts_with: [],
              crop_template: null,
            },
          ],
        },
      ],
    },
  },
};

// The lightbox and re-crop editor fetch the vocabulary without a target
const vocabularyMocks = [
  vocabularyMock,
  {
    ...vocabularyMock,
    request: {
      ...vocabularyMock.request,
      variables: { includeDisabled: true },
    },
  },
];

const image = (
  id: string,
  types: ImageTypeEnum[],
  organized = false,
): ImageFragment => ({
  __typename: "Image" as const,
  id,
  url: `https://example.com/${id}.jpg`,
  width: 800,
  height: 1200,
  types,
  date: null,
  organized,
  originalImage: null,
});

const square = { ...image("a", []), width: 1000, height: 1000 };

const Harness: FC<{
  images: ImageFragment[];
  original?: ImageFragment[];
  maxImages?: number;
}> = ({ images, original, maxImages }) => {
  const { control } = useForm<{ images: ImageFragment[] }>({
    defaultValues: { images },
  });
  const lens = useLens({ control });

  return (
    <EditImages
      lens={lens.focus("images").cast<ImageFragment[]>()}
      file={undefined}
      setFile={() => {}}
      original={original}
      target={ImageTypeScopeEnum.PERFORMER}
      maxImages={maxImages}
      showCategorization
    />
  );
};

const Uploading: FC<{ file: File; target?: ImageTypeScopeEnum }> = ({
  file: initialFile,
  target = ImageTypeScopeEnum.PERFORMER,
}) => {
  const [file, setFile] = useState<File | undefined>(initialFile);
  const { control } = useForm<{ images: ImageFragment[] }>({
    defaultValues: { images: [] },
  });
  const lens = useLens({ control });

  return (
    <EditImages
      lens={lens.focus("images").cast<ImageFragment[]>()}
      file={file}
      setFile={setFile}
      target={target}
    />
  );
};

const drawn = () => document.querySelectorAll(".CropOverlay-guide");

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  const [thumbnail] = screen.getAllByRole("button", { name: /image/i });
  await user.click(thumbnail);
};

const asEditor = {
  authenticated: true,
  user: { id: "u-1", name: "editor", roles: [RoleEnum.EDIT] },
};

const categorization = (
  id: string,
  types: ImageTypeEnum[] = [],
  date: string | null = null,
) => ({
  request: { query: ImageCategorizationDocument, variables: { id } },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      findImage: {
        __typename: "Image" as const,
        id,
        types,
        date,
        organized: false,
      },
    },
  },
});

// What an untouched re-crop of the square sends; MockedProvider matches variables exactly
const recropMock = (date: string | null) => ({
  request: {
    query: RecropImageDocument,
    variables: {
      imageData: {
        image_id: "a",
        crop: largestCenteredRect(2 / 3, 1),
        types: [ImageTypeEnum.CROP_FACE],
        date,
      },
    },
  },
  result: {
    data: {
      imageRecrop: {
        ...image("b", [ImageTypeEnum.CROP_FACE]),
        width: 700,
        height: 1050,
        date,
      },
    },
  },
});

const openEditor = async (user: ReturnType<typeof userEvent.setup>) => {
  await open(user);
  await user.click(
    await screen.findByRole("button", { name: "Categorization" }),
  );
};

describe("EditImages lightbox guides", () => {
  it("draws the frame an existing image already claims", async () => {
    const { user } = renderForm(
      <Harness images={[image("a", [ImageTypeEnum.CROP_FACE])]} />,
      { mocks: [...vocabularyMocks] },
    );

    await open(user);

    const toggle = await screen.findByRole("button", { name: "Show guides" });
    expect(drawn()).toHaveLength(0);

    await user.click(toggle);

    await waitFor(() => expect(drawn()).toHaveLength(guides.length));
    expect(screen.getByText("Bisects the eyes")).toBeInTheDocument();
  });

  it("offers nothing to show for an image with no crop", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      mocks: [...vocabularyMocks],
    });

    await open(user);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: /guides/i })).toBeNull();
  });

  // A crop the instance has no template for is a label, not a frame
  it("offers nothing to show for a crop with no template", async () => {
    const { user } = renderForm(
      <Harness images={[image("a", [ImageTypeEnum.CROP_TORSO])]} />,
      { mocks: [...vocabularyMocks] },
    );

    await open(user);

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).toBeInTheDocument(),
    );
    expect(screen.queryByRole("button", { name: /guides/i })).toBeNull();
  });
});

describe("EditImages controls after an atomic label+crop", () => {
  it("keeps the new row editable, nothing locks without a moderator sign-off", async () => {
    const { user } = renderForm(<Harness images={[square]} />, {
      auth: asEditor,
      mocks: [
        ...vocabularyMocks,
        categorization("a"),
        categorization("b", [ImageTypeEnum.CROP_FACE], "2021-05"),
        recropMock("2021-05"),
      ],
    });

    await openEditor(user);
    await user.click(await screen.findByLabelText("Face"));
    await user.type(screen.getByLabelText("Image date"), "2021-05");

    await user.click(await screen.findByRole("button", { name: "Re-crop" }));
    await user.click(await screen.findByRole("button", { name: "Save crop" }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await openEditor(user);

    expect(await screen.findByRole("radio", { name: "Face" })).toBeChecked();
    expect(screen.getByLabelText("Image date")).toHaveValue("2021-05");
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Re-crop" })).toBeInTheDocument();
  });

  it("keeps the source image and appends the crop when adding as new", async () => {
    const { user } = renderForm(<Harness images={[square]} />, {
      auth: asEditor,
      mocks: [
        ...vocabularyMocks,
        categorization("a"),
        categorization("b", [ImageTypeEnum.CROP_FACE], "2021-05"),
        recropMock("2021-05"),
      ],
    });

    await openEditor(user);
    await user.click(await screen.findByLabelText("Face"));
    await user.type(screen.getByLabelText("Image date"), "2021-05");

    await user.click(await screen.findByRole("button", { name: "Re-crop" }));
    await user.click(
      await screen.findByRole("checkbox", { name: "Add as a new image" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Save as new image" }),
    );

    await waitFor(() =>
      expect(document.querySelector(".RecropEditor")).not.toBeInTheDocument(),
    );

    expect(document.querySelectorAll(".ImageInput")).toHaveLength(2);

    expect(
      await screen.findByRole("radio", { name: "Face" }),
    ).not.toBeChecked();
    expect(screen.getByLabelText("Image date")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    const confirm = vi.spyOn(window, "confirm");
    await user.click(
      document.querySelector(".ImageLightbox-close") as HTMLElement,
    );
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  describe("of an organized image", () => {
    const organized = {
      ...square,
      types: [ImageTypeEnum.CROP_FACE],
      organized: true,
    };

    it("re-crops only as a new image, keeping the organized one", async () => {
      const { user } = renderForm(
        <Harness images={[organized]} original={[organized]} />,
        { mocks: [...vocabularyMocks, recropMock(null)] },
      );

      await open(user);
      await user.click(await screen.findByRole("button", { name: "Re-crop" }));

      expect(
        screen.queryByRole("checkbox", { name: "Add as a new image" }),
      ).not.toBeInTheDocument();
      await user.click(
        await screen.findByRole("button", { name: "Save as new image" }),
      );

      await waitFor(() =>
        expect(document.querySelector(".RecropEditor")).not.toBeInTheDocument(),
      );
      expect(document.querySelectorAll(".ImageInput")).toHaveLength(2);
    });

    it("offers no re-crop when there is no room for another image", async () => {
      const { user } = renderForm(
        <Harness images={[organized]} original={[organized]} maxImages={1} />,
        { mocks: [...vocabularyMocks] },
      );

      await open(user);
      await screen.findByRole("button", { name: /guides/i });

      expect(screen.queryByRole("button", { name: "Re-crop" })).toBeNull();
    });
  });
});

describe("EditImages action row", () => {
  const pending = () =>
    new File(["pixels"], "photo.jpg", { type: "image/jpeg" });

  it("keeps Remove and Upload under the picture, and Reset Images outside it", async () => {
    renderForm(<Uploading file={pending()} />, { mocks: [...vocabularyMocks] });

    await screen.findByLabelText("Face");

    const row = screen.getByRole("button", { name: "Remove" }).parentElement;
    expect(row?.closest(".CropStep-image")).not.toBeNull();
    expect(row).toContainElement(
      screen.getByRole("button", { name: "Upload" }),
    );
    expect(
      screen
        .getByRole("button", { name: "Reset Images" })
        .closest(".CropStep-image"),
    ).toBeNull();
  });

  it("drops the file when Remove is clicked", async () => {
    const { user } = renderForm(<Uploading file={pending()} />, {
      mocks: [...vocabularyMocks],
    });

    await screen.findByLabelText("Face");
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    expect(screen.getByText("Add image")).toBeInTheDocument();
  });
});

describe("EditImages size warnings", () => {
  const sized = (
    id: string,
    [width, height]: [number, number],
    original?: [number, number],
    types: ImageTypeEnum[] = [],
  ): ImageFragment => ({
    __typename: "Image" as const,
    id,
    url: `https://example.com/${id}.jpg`,
    width,
    height,
    types,
    date: null,
    organized: false,
    originalImage: original
      ? {
          __typename: "Image" as const,
          id: `${id}-original`,
          url: `https://example.com/${id}-original.jpg`,
          width: original[0],
          height: original[1],
        }
      : null,
  });

  it("flags a crop that threw away a usable original", async () => {
    renderForm(
      <Harness images={[sized("img-red", [400, 600], [1539, 2309])]} />,
      { mocks: [...vocabularyMocks] },
    );

    expect(await screen.findByText("Too small")).toBeInTheDocument();
    expect(screen.queryByText("Small")).toBeNull();
  });

  it("takes the Detail exemption from the image's label", async () => {
    renderForm(
      <Harness
        images={[
          sized(
            "img-detail",
            [400, 600],
            [1539, 2309],
            [ImageTypeEnum.SHOT_DETAIL],
          ),
        ]}
      />,
      { mocks: [...vocabularyMocks] },
    );

    await screen.findByText("400 x 600");
    expect(screen.queryByText(/small/i)).toBeNull();
  });
});
