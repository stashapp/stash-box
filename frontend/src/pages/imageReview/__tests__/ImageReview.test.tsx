import { screen, waitFor } from "@testing-library/react";
import { ImageTypeEnum, ImageTypeGroupEnum, RoleEnum } from "src/graphql";
import RevertImageCategorizationGQL from "src/graphql/mutations/RevertImageCategorization.gql";
import SetImageOrganizedGQL from "src/graphql/mutations/SetImageOrganized.gql";
import ImageTypeGroupsGQL from "src/graphql/queries/ImageTypeGroups.gql";
import UnorganizedImagesGQL from "src/graphql/queries/UnorganizedImages.gql";
import { renderForm } from "src/test/renderForm";
import { describe, expect, it } from "vitest";

import ImageReview from "../ImageReview";

const moderator = {
  authenticated: true,
  user: { id: "mod-1", name: "mod", roles: [RoleEnum.MODERATE] },
};

const editor = {
  authenticated: true,
  user: { id: "edit-1", name: "editor", roles: [RoleEnum.EDIT] },
};

const vocabulary = {
  request: { query: ImageTypeGroupsGQL, variables: {} },
  maxUsageCount: Number.POSITIVE_INFINITY,
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

const feedImage = (id: string) => ({
  __typename: "UnorganizedImage" as const,
  image: {
    __typename: "Image" as const,
    id,
    url: `http://example.test/${id}`,
    width: 400,
    height: 600,
    types: [ImageTypeEnum.SHOT_PORTRAIT],
    date: "2024-05",
    organized: false,
    categorized_at: "2026-09-01T12:00:00Z",
    categorized_by: { __typename: "User" as const, id: "u-1", name: "carla" },
  },
  performer: { __typename: "Performer" as const, id: "p-1", name: "Alice" },
});

const feedResponse = (
  ids: string[],
  performerID: string | null = null,
  userID: string | null = null,
) => ({
  request: {
    query: UnorganizedImagesGQL,
    variables: {
      input: {
        page: 1,
        per_page: 25,
        performer_id: performerID,
        user_id: userID,
      },
    },
  },
  result: {
    data: {
      queryUnorganizedImages: {
        __typename: "QueryUnorganizedImagesResultType" as const,
        count: ids.length,
        images: ids.map(feedImage),
      },
    },
  },
});

describe("ImageReview", () => {
  it("turns non-moderators away", () => {
    renderForm(<ImageReview />, { auth: editor, mocks: [vocabulary] });

    expect(screen.getByText(/Forbidden/)).toBeInTheDocument();
  });

  it("lists the feed with performer, labels and recency", async () => {
    renderForm(<ImageReview />, {
      auth: moderator,
      mocks: [vocabulary, feedResponse(["img-1"])],
    });

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    // Label keys resolve to display names, with the date alongside
    await waitFor(() =>
      expect(screen.getByText("Portrait, 2024-05")).toBeInTheDocument(),
    );
    // The categorizer is named, since the feed is where a mod
    // would go looking for whom to ask about a label
    expect(screen.getByText("carla")).toBeInTheDocument();
  });

  it("narrows to one performer via the query string", async () => {
    renderForm(<ImageReview />, {
      auth: moderator,
      route: "/image-review?performer=p-1",
      mocks: [vocabulary, feedResponse(["img-9"], "p-1")],
    });

    // Resolving at all proves the filtered variables were sent:
    // MockedProvider only matches on the exact input
    expect(await screen.findByText("Alice")).toBeInTheDocument();
  });

  it("narrows to one user via the query string", async () => {
    renderForm(<ImageReview />, {
      auth: moderator,
      route: "/image-review?user=u-1",
      mocks: [vocabulary, feedResponse(["img-9"], null, "u-1")],
    });

    // Resolving at all proves the filtered variables were sent
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Show everything")).toBeInTheDocument();
  });

  it("pivots to one user's categorizations from the By column", async () => {
    const { user } = renderForm(<ImageReview />, {
      auth: moderator,
      mocks: [
        vocabulary,
        feedResponse(["img-1"]),
        feedResponse(["img-1"], null, "u-1"),
      ],
    });

    await user.click(
      await screen.findByRole("button", {
        name: "Show only this user's categorizations",
      }),
    );

    // The filtered query resolving proves the pivot sent the user id
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Show everything")).toBeInTheDocument();
  });

  // The pivot narrows within whatever view the moderator is already in:
  // it must not clobber an active performer filter on its way
  it("keeps the performer filter when pivoting to a user", async () => {
    const { user } = renderForm(<ImageReview />, {
      auth: moderator,
      route: "/image-review?performer=p-1",
      mocks: [
        vocabulary,
        feedResponse(["img-1"], "p-1"),
        feedResponse(["img-1"], "p-1", "u-1"),
      ],
    });

    await user.click(
      await screen.findByRole("button", {
        name: "Show only this user's categorizations",
      }),
    );

    // Both filters in the request (MockedProvider matches variables exactly), and the copy names both
    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(
      screen.getByText(/one performer's images and one user's categorizations/),
    ).toBeInTheDocument();
  });

  it("reverts a row in place, without refetching the feed", async () => {
    let reverted = false;
    const mutation = {
      request: {
        query: RevertImageCategorizationGQL,
        variables: { input: { id: "img-1" } },
      },
      result: () => {
        reverted = true;
        return {
          data: {
            imageRevertCategorization: {
              __typename: "Image" as const,
              id: "img-1",
              url: "http://example.test/img-1",
              width: 400,
              height: 600,
              types: [],
              date: null,
              organized: false,
              categorized_at: null,
              categorized_by: null,
            },
          },
        };
      },
    };

    // No second feed mock on purpose: the mutation result updates the cached
    // row and the page re-derives membership locally, so a refetch here
    // would be an unmatched request and fail the test
    const { user } = renderForm(<ImageReview />, {
      auth: moderator,
      mocks: [vocabulary, feedResponse(["img-1"]), mutation],
    });

    await user.click(await screen.findByRole("button", { name: "Revert" }));

    // The revert cleared the only categorization, so the row leaves the feed
    await waitFor(() => expect(reverted).toBe(true));
    await waitFor(() => expect(screen.queryByText("Alice")).toBeNull());
  });

  it("styles Revert as a solid destructive button", async () => {
    renderForm(<ImageReview />, {
      auth: moderator,
      mocks: [vocabulary, feedResponse(["img-1"])],
    });

    const revert = await screen.findByRole("button", { name: "Revert" });
    expect(revert.className).toContain("btn-danger");
    expect(revert.className).not.toContain("btn-outline-danger");
  });

  it("marks a row organized and drops it from the feed", async () => {
    let mutated = false;
    const mutation = {
      request: {
        query: SetImageOrganizedGQL,
        variables: { input: { id: "img-1", organized: true } },
      },
      result: () => {
        mutated = true;
        return {
          data: {
            imageSetOrganized: {
              __typename: "Image" as const,
              id: "img-1",
              url: "http://example.test/img-1",
              width: 400,
              height: 600,
              types: [ImageTypeEnum.SHOT_PORTRAIT],
              date: "2024-05",
              organized: true,
            },
          },
        };
      },
    };

    const { user } = renderForm(<ImageReview />, {
      auth: moderator,
      mocks: [vocabulary, feedResponse(["img-1"]), mutation],
    });

    await user.click(
      await screen.findByRole("button", { name: "Mark organized" }),
    );

    await waitFor(() => expect(mutated).toBe(true));
    await waitFor(() => expect(screen.queryByText("Alice")).toBeNull());
  });

  it("reports a failed sign-off and keeps the row", async () => {
    const mutation = {
      request: {
        query: SetImageOrganizedGQL,
        variables: { input: { id: "img-1", organized: true } },
      },
      error: new Error("Failed to fetch"),
    };

    const { user } = renderForm(<ImageReview />, {
      auth: moderator,
      mocks: [vocabulary, feedResponse(["img-1"]), mutation],
    });

    await user.click(
      await screen.findByRole("button", { name: "Mark organized" }),
    );

    // A network failure is not a GraphQL error:
    // it must still reach the moderator, and the row must not leave the feed
    expect(await screen.findByText(/Failed to fetch/)).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark organized" }),
    ).toBeEnabled();
  });
});
