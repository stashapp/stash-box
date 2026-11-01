import { screen } from "@testing-library/react";
import { configMock } from "lib/test/mocks/graphql";
import { renderForm } from "lib/test/render";
import {
  ImageDocument as ImageGQL,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  ImageTypeGroupsDocument as ImageTypeGroupsGQL,
  RoleEnum,
} from "src/graphql";
import { describe, expect, it } from "vitest";

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
            },
          ],
        },
      ],
    },
  },
};

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
    renderForm(<ImagePage />, {
      routePath: "/image/$id",
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
    });
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
    renderForm(<ImagePage />, {
      routePath: "/image/$id",
      route: "/image/image-1",
      mocks: [image, vocabulary, configMock],
    });

    expect(await screen.findByText("Portrait")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.getByText("Performer A")).toBeInTheDocument();
    expect(screen.getByText("Scene A")).toBeInTheDocument();
    expect(screen.getByText("Studio A")).toBeInTheDocument();
    expect(screen.getByText("800 × 1199")).toBeInTheDocument();
  });

  it("uses the shared editor's draft guard when cancelling", async () => {
    const { user } = renderForm(<ImagePage editing />, {
      route: "/image/image-1/edit",
      routePath: "/image/$id/edit",
      routes: [{ path: "/image/$id", element: <div>Image details</div> }],
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
    });

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
});
