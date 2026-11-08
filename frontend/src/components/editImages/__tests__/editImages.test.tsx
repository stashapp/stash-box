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
      { mocks: [vocabularyMock] },
    );

    await open(user);

    // Off until asked for: the lightbox is for looking at the image
    const toggle = await screen.findByRole("button", { name: "Show guides" });
    expect(drawn()).toHaveLength(0);

    await user.click(toggle);

    await waitFor(() => expect(drawn()).toHaveLength(guides.length));
    expect(screen.getByText("Bisects the eyes")).toBeInTheDocument();
  });

  it("offers nothing to show for an image with no crop", async () => {
    const { user } = renderForm(<Harness images={[image("a", [])]} />, {
      mocks: [vocabularyMock],
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
      { mocks: [vocabularyMock] },
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
    const square: ImageFragment = {
      __typename: "Image" as const,
      id: "a",
      url: "https://example.com/a.jpg",
      width: 1000,
      height: 1000,
      types: [],
      date: null,
      organized: false,
      originalImage: null,
    };
    const rect = largestCenteredRect(2 / 3, 1);

    const { user } = renderForm(<Harness images={[square]} />, {
      auth: asEditor,
      mocks: [
        vocabularyMock,
        categorization("a"),
        categorization("b", [ImageTypeEnum.CROP_FACE], "2021-05"),
        {
          // Proof the label and date actually rode along with the crop:
          // MockedProvider only resolves on an exact variables match
          request: {
            query: RecropImageDocument,
            variables: {
              imageData: {
                image_id: "a",
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
                id: "b",
                url: "https://example.com/b.jpg",
                width: 700,
                height: 1050,
                types: [ImageTypeEnum.CROP_FACE],
                date: "2021-05",
                organized: false,
                originalImage: null,
              },
            },
          },
        },
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
    const square: ImageFragment = {
      __typename: "Image" as const,
      id: "a",
      url: "https://example.com/a.jpg",
      width: 1000,
      height: 1000,
      types: [],
      date: null,
      organized: false,
      originalImage: null,
    };
    const rect = largestCenteredRect(2 / 3, 1);

    const { user } = renderForm(<Harness images={[square]} />, {
      auth: asEditor,
      mocks: [
        vocabularyMock,
        categorization("a"),
        categorization("b", [ImageTypeEnum.CROP_FACE], "2021-05"),
        {
          request: {
            query: RecropImageDocument,
            variables: {
              imageData: {
                image_id: "a",
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
                id: "b",
                url: "https://example.com/b.jpg",
                width: 700,
                height: 1050,
                types: [ImageTypeEnum.CROP_FACE],
                date: "2021-05",
                organized: false,
                originalImage: null,
              },
            },
          },
        },
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

    expect(document.querySelectorAll(".EditImages-image-entry")).toHaveLength(
      2,
    );

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
    const organized: ImageFragment = {
      __typename: "Image" as const,
      id: "a",
      url: "https://example.com/a.jpg",
      width: 1000,
      height: 1000,
      types: [ImageTypeEnum.CROP_FACE],
      date: null,
      organized: true,
      originalImage: null,
    };
    const rect = largestCenteredRect(2 / 3, 1);
    const recropMock = {
      request: {
        query: RecropImageDocument,
        variables: {
          imageData: {
            image_id: "a",
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
            id: "b",
            url: "https://example.com/b.jpg",
            width: 700,
            height: 1050,
            types: [ImageTypeEnum.CROP_FACE],
            date: null,
            organized: false,
            originalImage: null,
          },
        },
      },
    };

    it("re-crops only as a new image, keeping the organized one", async () => {
      const { user } = renderForm(
        <Harness images={[organized]} original={[organized]} />,
        { mocks: [vocabularyMock, recropMock] },
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
      expect(document.querySelectorAll(".EditImages-image-entry")).toHaveLength(
        2,
      );
    });

    it("offers no re-crop when there is no room for another image", async () => {
      const { user } = renderForm(
        <Harness images={[organized]} original={[organized]} maxImages={1} />,
        { mocks: [vocabularyMock] },
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

  it("puts Remove and Upload on Reset Images' row", async () => {
    renderForm(<Uploading file={pending()} />, { mocks: [vocabularyMock] });

    await screen.findByLabelText("Face");

    const row = screen.getByRole("button", { name: "Remove" }).parentElement;
    expect(row).toBe(
      screen.getByRole("button", { name: "Reset Images" }).parentElement,
    );
    expect(row).toContainElement(
      screen.getByRole("button", { name: "Upload" }),
    );
  });

  it("drops the file when Remove is clicked", async () => {
    const { user } = renderForm(<Uploading file={pending()} />, {
      mocks: [vocabularyMock],
    });

    await screen.findByLabelText("Face");
    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    expect(screen.getByText("Add image")).toBeInTheDocument();
  });
});

describe("EditImages action row placement", () => {
  const pending = () =>
    new File(["pixels"], "photo.jpg", { type: "image/jpeg" });

  it("keeps the action row in the picture's column", async () => {
    renderForm(<Uploading file={pending()} />, { mocks: [vocabularyMock] });

    await screen.findByLabelText("Face");

    expect(
      screen.getByRole("button", { name: "Remove" }).closest(".CropStep-image"),
    ).not.toBeNull();
    expect(
      screen
        .getByRole("button", { name: "Reset Images" })
        .closest(".CropStep-image"),
    ).not.toBeNull();
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
          types: [],
          organized: false,
        }
      : null,
  });

  it("says nothing about a picture big enough to use", async () => {
    renderForm(
      <Harness images={[sized("img-ok", [800, 1200], [1539, 2309])]} />,
      {
        mocks: [vocabularyMock],
      },
    );

    await screen.findByText("800 x 1200");
    expect(screen.queryByText(/small/i)).toBeNull();
  });

  it("flags a crop that threw away a usable original", async () => {
    renderForm(
      <Harness images={[sized("img-red", [400, 600], [1539, 2309])]} />,
      { mocks: [vocabularyMock] },
    );

    expect(await screen.findByText("Too small")).toBeInTheDocument();
    expect(screen.queryByText("Small")).toBeNull();
  });

  it("only doubts a crop whose original had little more to give", async () => {
    renderForm(
      <Harness images={[sized("img-yellow", [560, 840], [600, 900])]} />,
      {
        mocks: [vocabularyMock],
      },
    );

    expect(await screen.findByText("Small")).toBeInTheDocument();
  });

  it("answers the floor for a picture that was never cropped", async () => {
    renderForm(<Harness images={[sized("img-plain", [400, 600])]} />, {
      mocks: [vocabularyMock],
    });

    expect(await screen.findByText("Small")).toBeInTheDocument();
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
      { mocks: [vocabularyMock] },
    );

    await screen.findByText("400 x 600");
    expect(screen.queryByText(/small/i)).toBeNull();
  });
});
