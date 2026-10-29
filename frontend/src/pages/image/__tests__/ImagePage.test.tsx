import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import {
  ImageDocument as ImageGQL,
  ImageTypeEnum,
  ImageTypeGroupEnum,
  ImageTypeGroupsDocument as ImageTypeGroupsGQL,
  RoleEnum,
} from "src/graphql";
import { configMock } from "src/test/graphqlMocks";

import { renderForm } from "src/test/renderForm";
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
});
