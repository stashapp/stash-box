import { gql, InMemoryCache } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { MockedProvider } from "@apollo/client/testing/react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestRouter } from "lib/test/router";
import { useState } from "react";
import {
  ImageTypeGroupEnum as G,
  ImageTypeGroupsDocument,
  ImageTypeEnum as T,
  UpdateImageTypePreferencesDocument,
} from "src/graphql";
import { describe, expect, it } from "vitest";
import { UserImageTypePreferences } from "../UserImageTypePreferences";

const userFragment = gql`
  fragment PreferencesTestUser on User {
    id name image_type_preferences image_type_group_preferences
  }
`;
const userQuery = gql`
  query PreferencesTestUserQuery {
    findUser(username: "alice") { ...PreferencesTestUser }
  }
  ${userFragment}
`;
const groups = [
  {
    __typename: "ImageTypeGroup",
    key: G.SHOT,
    name: "Shot",
    description: null,
    enabled: true,
    types: [],
  },
  {
    __typename: "ImageTypeGroup",
    key: G.CROP,
    name: "Crop",
    description: null,
    enabled: true,
    types: [
      {
        __typename: "ImageType",
        key: T.CROP_FACE,
        name: "Face",
        description: null,
        enabled: true,
        conflicts_with: [],
      },
      {
        __typename: "ImageType",
        key: T.CROP_BUST,
        name: "Bust",
        description: null,
        enabled: true,
        conflicts_with: [],
      },
    ],
  },
];
const defaultUser = {
  __typename: "User",
  id: "u-1",
  name: "alice",
  image_type_preferences: [] as T[],
  image_type_group_preferences: [] as G[],
};

function setup(
  input: { types: T[]; groups: G[] },
  initial = defaultUser,
  succeeds = true,
) {
  const cache = new InMemoryCache();
  cache.writeQuery({
    query: userQuery,
    data: { findUser: initial },
  });
  function Harness() {
    const [open, setOpen] = useState(true);
    const { data } = useQuery<{ findUser: typeof defaultUser }>(userQuery);
    const user = data?.findUser;
    return (
      <>
        <button type="button" onClick={() => setOpen(!open)}>
          {open ? "Leave" : "Reopen"}
        </button>
        {open && user && <UserImageTypePreferences user={user} />}
      </>
    );
  }
  const view = render(
    <MockedProvider
      cache={cache}
      mocks={[
        {
          request: { query: userQuery },
          result: {
            data: {
              findUser: {
                ...initial,
                image_type_preferences: input.types,
                image_type_group_preferences: input.groups,
              },
            },
          },
        },
        {
          request: { query: ImageTypeGroupsDocument, variables: {} },
          result: { data: { imageTypeGroups: groups } },
        },
        {
          request: {
            query: UpdateImageTypePreferencesDocument,
            variables: { input },
          },
          result: { data: { updateImageTypePreferences: succeeds } },
        },
      ]}
    >
      <TestRouter>
        <Harness />
      </TestRouter>
    </MockedProvider>,
  );
  return { ...view, user: userEvent.setup(), cache };
}
const displayedGroups = () =>
  screen.getAllByTitle(/Drag the .* group/).map((button) => button.title);
const displayedTypes = () =>
  screen.getAllByTitle(/Drag (Face|Bust)/).map((button) => button.title);

describe("UserImageTypePreferences", () => {
  it("keeps saved group and label order when reopening the form", async () => {
    const { user, cache } = setup({
      types: [T.CROP_BUST, T.CROP_FACE],
      groups: [G.CROP, G.SHOT],
    });
    const group = await screen.findByTitle(/Drag the Crop group/);
    group.focus();
    await user.keyboard("{ArrowUp}");
    screen.getByTitle(/Drag Bust/).focus();
    await user.keyboard("{ArrowUp}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Preferences saved.");
    expect(
      cache.readFragment({ id: "User:u-1", fragment: userFragment }),
    ).toMatchObject({
      image_type_preferences: [T.CROP_BUST, T.CROP_FACE],
      image_type_group_preferences: [G.CROP, G.SHOT],
    });
    await user.click(screen.getByText("Leave"));
    await user.click(screen.getByText("Reopen"));
    expect(displayedGroups()[0]).toContain("Crop");
    expect(displayedTypes()[0]).toContain("Bust");
  });

  it("resets the displayed order and cached preferences to the site default", async () => {
    const { user, cache } = setup(
      { types: [], groups: [] },
      {
        ...defaultUser,
        image_type_preferences: [T.CROP_BUST, T.CROP_FACE],
        image_type_group_preferences: [G.CROP, G.SHOT],
      },
    );
    await screen.findByTitle(/Drag the Crop group/);
    expect(displayedGroups()[0]).toContain("Crop");
    await user.click(screen.getByText("Use site default"));
    await screen.findByText("Preferences saved.");
    expect(displayedGroups()[0]).toContain("Shot");
    expect(displayedTypes()[0]).toContain("Face");
    expect(
      cache.readFragment({ id: "User:u-1", fragment: userFragment }),
    ).toMatchObject({
      image_type_preferences: [],
      image_type_group_preferences: [],
    });
    await user.click(screen.getByText("Leave"));
    await user.click(screen.getByText("Reopen"));
    expect(displayedGroups()[0]).toContain("Shot");
    expect(displayedTypes()[0]).toContain("Face");
  });

  it("keeps the current order and reports an unsuccessful reset", async () => {
    const { user, cache } = setup(
      { types: [], groups: [] },
      {
        ...defaultUser,
        image_type_group_preferences: [G.CROP, G.SHOT],
      },
      false,
    );
    await screen.findByTitle(/Drag the Crop group/);
    await user.click(screen.getByText("Use site default"));
    await screen.findByText(/Failed to save image preferences/);
    expect(displayedGroups()[0]).toContain("Crop");
    expect(
      cache.readFragment({ id: "User:u-1", fragment: userFragment }),
    ).toMatchObject({ image_type_group_preferences: [G.CROP, G.SHOT] });
    expect(screen.queryByText("Preferences saved.")).not.toBeInTheDocument();
  });
});
