import { InMemoryCache } from "@apollo/client";
import { MockedProvider } from "@apollo/client/testing/react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { configMock } from "lib/test/mocks/graphql";
import { TestRouter } from "lib/test/router";
import AuthContext from "src/context";
import {
  ImageCategorizationDocument,
  ImageTypeGroupsDocument,
  ImageTypeScopeEnum,
  RoleEnum,
} from "src/graphql";
import { describe, expect, it } from "vitest";
import Image from "../Image";

const images = [
  { id: "first", url: "/first.jpg", width: 400, height: 600 },
  { id: "second", url: "/second.jpg", width: 400, height: 600 },
];

const openLightbox = async (role: RoleEnum) => {
  const cache = new InMemoryCache();

  for (const image of images) {
    cache.writeQuery({
      query: ImageCategorizationDocument,
      variables: { id: image.id },
      data: {
        __typename: "Query",
        findImage: {
          __typename: "Image",
          id: image.id,
          types: [],
          date: null,
          organized: false,
        },
      },
    });
  }

  cache.writeQuery({
    query: ImageTypeGroupsDocument,
    variables: {
      target: ImageTypeScopeEnum.PERFORMER,
      includeDisabled: true,
    },
    data: {
      __typename: "Query",
      imageTypeGroups: [],
    },
  });

  render(
    <TestRouter>
      <MockedProvider cache={cache} mocks={[configMock]}>
        <AuthContext.Provider
          value={{
            authenticated: true,
            user: { id: "viewer", name: "viewer", roles: [role] },
          }}
        >
          <Image images={images} lightbox showCategorization />
        </AuthContext.Provider>
      </MockedProvider>
    </TestRouter>,
  );

  const user = userEvent.setup();
  await user.click(screen.getByRole("button"));
  await user.click(screen.getByRole("button", { name: "Categorization" }));

  return user;
};

describe("lightbox categorization navigation", () => {
  it("protects a real draft when switching tabs, images, and closing", async () => {
    const user = await openLightbox(RoleEnum.EDIT);
    await user.type(screen.getByLabelText("Image date"), "2020");

    await user.click(screen.getByRole("link", { name: "Details" }));
    expect(
      screen.getByText("Discard categorization changes?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Image date")).toHaveValue("2020");

    await user.click(screen.getByRole("button", { name: "Images" }));
    expect(
      screen.getByText("Discard categorization changes?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Image date")).toHaveValue("2020");

    await user.click(screen.getByRole("button", { name: "Next image" }));
    expect(
      screen.getByText("Discard categorization changes?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.getByText("2 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Image date")).toHaveValue("");

    await user.type(screen.getByLabelText("Image date"), "2021");
    await user.keyboard("{Escape}");
    expect(
      screen.getByText("Discard categorization changes?"),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows a read-only panel for a non-editor", async () => {
    await openLightbox(RoleEnum.READ);
    const panel = screen.getByRole("group", {
      name: "Image classification and date",
    });

    expect(within(panel).getByText("Classification")).toBeInTheDocument();
    expect(within(panel).queryAllByRole("radio")).toHaveLength(0);
    expect(within(panel).queryAllByRole("textbox")).toHaveLength(0);
    expect(within(panel).queryByRole("button", { name: "Save" })).toBeNull();
    expect(within(panel).queryByLabelText("Organized")).toBeNull();
  });
});
