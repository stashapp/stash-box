import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import {
  CropGuideAxisEnum,
  CropGuideRoleEnum,
  ImageDocument as ImageGQL,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  ImageTypeGroupsDocument as ImageTypeGroupsGQL,
  RoleEnum,
} from "src/graphql";
import { configMock } from "src/test/graphqlMocks";

import { renderForm } from "src/test/renderForm";
import { beforeEach, describe, expect, it } from "vitest";

import ImagePage from "../ImagePage";

const image = {
  request: { query: ImageGQL, variables: { id: "image-1" } },
  result: {
    data: {
      findImage: {
        __typename: "Image" as const,
        id: "image-1",
        url: "/images/image-1",
        width: 800,
        height: 1199,
        types: [ImageTypeEnum.SHOT_PORTRAIT],
        date: "2024-05",
        organized: false,
        edits: [
          {
            __typename: "Edit" as const,
            id: "e-1",
            created: "2026-10-01T12:00:00Z",
            target: null,
            details: null,
            operation: "MODIFY",
            status: "ACCEPTED",
            applied: true,
            user: { __typename: "User" as const, id: "u-1", name: "alice" },
          },
        ],
        categorized_at: "2026-10-02T12:00:00Z",
        categorized_by: { __typename: "User" as const, id: "u-2", name: "bob" },
        performers: [
          { __typename: "Performer" as const, id: "p-1", name: "Performer A" },
        ],
        scenes: [{ __typename: "Scene" as const, id: "s-1", title: "Scene A" }],
        studios: [
          { __typename: "Studio" as const, id: "st-1", name: "Studio A" },
        ],
      },
    },
  },
};

const vocabulary = {
  request: {
    query: ImageTypeGroupsGQL,
    variables: { includeDisabled: true },
  },
  result: {
    data: {
      imageTypeGroups: [
        {
          __typename: "ImageTypeGroup" as const,
          key: ImageTypeGroupEnum.SHOT,
          name: "Style",
          description: null,
          enabled: true,
          types: [
            {
              __typename: "ImageType" as const,
              key: ImageTypeEnum.SHOT_PORTRAIT,
              name: "Portrait",
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

const guide = (position: number, label: string) => ({
  __typename: "CropGuide" as const,
  axis: CropGuideAxisEnum.Y,
  position,
  role: CropGuideRoleEnum.ANCHOR,
  label,
});

const cropVocabulary = {
  ...vocabulary,
  result: {
    data: {
      imageTypeGroups: [
        ...vocabulary.result.data.imageTypeGroups,
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
                width: 800,
                height: 1200,
                guides: [guide(0.425, "Bisects the eyes"), guide(0.77, "Chin")],
              },
            },
          ],
        },
      ],
    },
  },
};

const cropped = {
  ...image,
  result: {
    data: {
      findImage: {
        ...image.result.data.findImage,
        types: [ImageTypeEnum.CROP_FACE],
      },
    },
  },
};

const recropped = {
  ...image,
  result: {
    data: {
      findImage: {
        ...image.result.data.findImage,
        originalImage: {
          __typename: "Image" as const,
          id: "image-0",
          url: "/images/image-0",
          width: 1600,
          height: 1200,
          types: [],
          organized: false,
        },
      },
    },
  },
};

const details = (
  <Routes>
    <Route path="/image/:id" element={<ImagePage />} />
  </Routes>
);

const drawn = () => document.querySelectorAll(".CropOverlay-guide");

beforeEach(() => sessionStorage.clear());

describe("ImagePage", () => {
  it.each([
    {
      status: "ACCEPTED",
      applied: true,
      removed: false,
      title: "Added",
      icon: "check",
      color: "text-success",
      text: "Added to",
    },
    {
      status: "ACCEPTED",
      applied: true,
      removed: true,
      title: "Removed",
      icon: "xmark",
      color: "text-danger",
      text: "Removed from",
    },
    {
      status: "CANCELED",
      applied: false,
      removed: true,
      title: "Cancelled",
      icon: "ban",
      color: "text-muted",
      text: "Removal from",
    },
    {
      status: "FAILED",
      applied: false,
      removed: true,
      title: "Failed",
      icon: "triangle-exclamation",
      color: "text-warning",
      text: "Removal from",
    },
    {
      status: "PENDING",
      applied: false,
      removed: false,
      title: "Pending",
      icon: "clock",
      color: "text-warning",
      text: "Addition to",
    },
    {
      status: "REJECTED",
      applied: false,
      removed: true,
      title: "Rejected",
      icon: "ban",
      color: "text-muted",
      text: "Removal from",
    },
  ])("distinguishes $title image edits", async ({
    status,
    applied,
    removed,
    title,
    icon,
    color,
    text,
  }) => {
    const edit = {
      ...image.result.data.findImage.edits[0],
      status,
      applied,
      details: {
        __typename: "PerformerEdit",
        added_images: removed ? [] : [{ __typename: "Image", id: "image-1" }],
        removed_images: removed ? [{ __typename: "Image", id: "image-1" }] : [],
      },
    };
    renderForm(
      <Routes>
        <Route path="/image/:id" element={<ImagePage />} />
      </Routes>,
      {
        route: "/image/image-1",
        mocks: [
          {
            ...image,
            result: {
              data: {
                findImage: { ...image.result.data.findImage, edits: [edit] },
              },
            },
          },
          vocabulary,
          configMock,
        ],
      },
    );
    const row = (await screen.findByText("alice")).closest("li");
    const glyph = row?.querySelector("svg");
    expect(glyph).toHaveAttribute("data-icon", icon);
    expect(glyph).toHaveClass(color);
    expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
    if (!applied) {
      expect(
        screen.getByText(new RegExp(`${title.toLowerCase()}, not applied`)),
      ).toBeInTheDocument();
      expect(
        screen.queryByText(/Removed from|Added to/),
      ).not.toBeInTheDocument();
    }
  });

  it("shows categorization, provenance, and every attachment kind", async () => {
    renderForm(
      <Routes>
        <Route path="/image/:id" element={<ImagePage />} />
      </Routes>,
      { route: "/image/image-1", mocks: [image, vocabulary, configMock] },
    );

    expect(await screen.findByText("Portrait")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByText("Performer A")).toBeInTheDocument();
    expect(screen.getByText("Scene A")).toBeInTheDocument();
    expect(screen.getByText("Studio A")).toBeInTheDocument();
    expect(screen.getByText("800 × 1199")).toBeInTheDocument();
  });

  it("uses the shared editor's draft guard when cancelling", async () => {
    const { user } = renderForm(
      <Routes>
        <Route path="/image/:id/edit" element={<ImagePage editing />} />
        <Route path="/image/:id" element={<div>Image details</div>} />
      </Routes>,
      {
        route: "/image/image-1/edit",
        auth: {
          authenticated: true,
          user: { id: "editor", name: "editor", roles: [RoleEnum.EDIT] },
        },
        mocks: [
          image,
          vocabulary,
          {
            ...vocabulary,
            request: {
              ...vocabulary.request,
              variables: { target: "PERFORMER", includeDisabled: true },
            },
          },
          configMock,
        ],
      },
    );

    const date = await screen.findByLabelText("Image date");
    await user.clear(date);
    await user.type(date, "2020");
    await user.click(screen.getByRole("button", { name: "Cancel editing" }));
    expect(
      screen.getByText("Discard categorization changes?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(date).toHaveValue("2020");
    await user.click(screen.getByRole("button", { name: "Cancel editing" }));
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.getByText("Image details")).toBeInTheDocument();
  });
  it("draws the claimed crop template's guides once asked for", async () => {
    const { user } = renderForm(details, {
      route: "/image/image-1",
      mocks: [cropped, cropVocabulary, configMock],
    });

    expect(await screen.findByText("Face")).toBeInTheDocument();
    expect(drawn()).toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Show guides" }));

    expect(drawn()).toHaveLength(2);
    expect(screen.getByText("Bisects the eyes")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide guides" }));

    expect(drawn()).toHaveLength(0);
  });

  it("offers no guides for an image whose labels claim no crop", async () => {
    renderForm(details, {
      route: "/image/image-1",
      mocks: [image, cropVocabulary, configMock],
    });

    expect(await screen.findByText("Portrait")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /guides/i }),
    ).not.toBeInTheDocument();
  });

  it("follows an unsaved label while it is being picked", async () => {
    const { user } = renderForm(
      <Routes>
        <Route path="/image/:id/edit" element={<ImagePage editing />} />
      </Routes>,
      {
        route: "/image/image-1/edit",
        auth: {
          authenticated: true,
          user: { id: "editor", name: "editor", roles: [RoleEnum.EDIT] },
        },
        mocks: [
          image,
          cropVocabulary,
          {
            ...cropVocabulary,
            request: {
              ...cropVocabulary.request,
              variables: { target: "PERFORMER", includeDisabled: true },
            },
          },
          configMock,
        ],
      },
    );

    const face = await screen.findByRole("radio", { name: "Face" });
    expect(
      screen.queryByRole("button", { name: /guides/i }),
    ).not.toBeInTheDocument();

    await user.click(face);
    await user.click(screen.getByRole("button", { name: "Show guides" }));

    expect(drawn()).toHaveLength(2);
  });

  it("links a cropped image to the original it was cut from", async () => {
    renderForm(details, {
      route: "/image/image-1",
      mocks: [recropped, cropVocabulary, configMock],
    });

    const link = await screen.findByRole("link", {
      name: "Cropped – view original",
    });

    expect(link).toHaveAttribute("href", "/images/image-0");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("offers no original for an image that was never cropped", async () => {
    renderForm(details, {
      route: "/image/image-1",
      mocks: [image, cropVocabulary, configMock],
    });

    expect(await screen.findByText("Portrait")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /view original/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps the guides shown when arriving with the preference already set", async () => {
    sessionStorage.setItem("stash-box.cropGuides", "1");

    renderForm(details, {
      route: "/image/image-1",
      mocks: [cropped, cropVocabulary, configMock],
    });

    expect(await screen.findByText("Face")).toBeInTheDocument();
    expect(drawn()).toHaveLength(2);
  });
});
