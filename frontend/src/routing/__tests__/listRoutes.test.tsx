import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutingTestContext } from "lib/test/appRouter";
import {
  makeEmptyEditsResult,
  makeListScene,
  makeSceneCountResult,
  makeScenesResult,
} from "lib/test/fixtures/lists";
import { makeRoutingUser } from "lib/test/fixtures/routing";
import { configMock } from "lib/test/mocks/graphql";
import { renderRoutingTest } from "lib/test/render";
import {
  CriterionModifier,
  EditSortEnum,
  EditsDocument,
  FavoriteFilter,
  SceneCountDocument,
  SceneSortEnum,
  ScenesDocument,
  SortDirectionEnum,
  UserVotedFilterEnum,
  VoteStatusEnum,
} from "src/graphql";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("src/Main", async () => ({
  default: (await import("lib/test/stubs/ContentOnly")).ContentOnly,
}));
vi.mock("src/components/title", () => ({ default: () => null }));
afterEach(() => vi.restoreAllMocks());

describe("route-owned lists", () => {
  it("validates list filters and passes only query inputs to the scene loader", async () => {
    const context = createRoutingTestContext(
      "/scenes?page=-3&sort=title&dir=asc&favorite=performer&fingerprint=001234&tag=tag-1",
      {
        user: makeRoutingUser(),
        mocks: [
          {
            request: {
              query: ScenesDocument,
              variables: {
                input: {
                  page: 1,
                  per_page: 20,
                  sort: SceneSortEnum.TITLE,
                  direction: SortDirectionEnum.ASC,
                  favorites: FavoriteFilter.PERFORMER,
                  fingerprints: {
                    value: ["001234"],
                    modifier: CriterionModifier.INCLUDES,
                  },
                  tags: {
                    value: ["tag-1"],
                    modifier: CriterionModifier.INCLUDES,
                  },
                },
              },
            },
            result: { data: makeScenesResult([makeListScene()]) },
          },
        ],
      },
    );
    const watch = vi.spyOn(context.client, "watchQuery");
    await context.router.load();
    expect(
      context.router.state.matches.every((match) => match.status === "success"),
    ).toBe(true);
    expect(watch).toHaveBeenCalledTimes(1); // The short page determines its count.
    expect(watch.mock.calls[0][0].query).toBe(ScenesDocument);
    await context.router.navigate({
      to: ".",
      search: (previous) => ({ ...previous, unrelated: "layout" }),
      hash: "preview",
    });
    expect(watch).toHaveBeenCalledTimes(1);
  });

  it("keeps edit headings and controls mounted while results change", async () => {
    const context = createRoutingTestContext("/edits", {
      user: makeRoutingUser(),
      mocks: [
        {
          request: { query: EditsDocument, variables: () => true },
          result: { data: makeEmptyEditsResult() },
        },
        {
          request: { query: EditsDocument, variables: () => true },
          result: { data: makeEmptyEditsResult() },
          delay: 400,
        },
      ],
    });
    const watch = vi.spyOn(context.client, "watchQuery");
    renderRoutingTest(context);
    await screen.findByText("No results");
    const heading = screen.getByRole("heading", { name: "Edits" });
    const order = screen.getAllByRole("combobox")[0];
    expect(watch.mock.calls[0][0].variables).toMatchObject({
      input: {
        page: 1,
        status: VoteStatusEnum.PENDING,
        voted: UserVotedFilterEnum.NOT_VOTED,
        is_bot: false,
        include_user_submitted: true,
      },
    });
    await userEvent.selectOptions(order, EditSortEnum.CLOSED_AT);
    expect(screen.getByRole("heading", { name: "Edits" })).toBe(heading);
    expect(screen.getAllByRole("combobox")[0]).toBe(order);
    expect(
      await screen.findByRole("status", { name: "Loading edits" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")[0]).toBe(order);
    await screen.findByText("No results");
    expect(
      watch.mock.calls.filter(([options]) => options.query === EditsDocument),
    ).toHaveLength(2);
    expect(watch.mock.calls[1][0].variables).toMatchObject({
      input: { sort: EditSortEnum.CLOSED_AT },
    });
    act(() => {
      void context.router.navigate({
        to: ".",
        search: (previous) => ({ ...previous, sort: EditSortEnum.CREATED_AT }),
      });
    });
    await waitFor(() => expect(order).toHaveValue(EditSortEnum.CREATED_AT));
  });

  it("keeps the scene controls through initial loading and recovers from result errors", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const context = createRoutingTestContext("/scenes", {
      user: makeRoutingUser(),
      mocks: [
        configMock,
        {
          request: { query: ScenesDocument, variables: () => true },
          error: new Error("Scene service unavailable"),
          delay: 300,
        },
        {
          request: { query: ScenesDocument, variables: () => true },
          result: { data: makeScenesResult() },
        },
        {
          request: { query: SceneCountDocument, variables: () => true },
          result: { data: makeSceneCountResult() },
        },
      ],
    });
    renderRoutingTest(context);
    const order = await screen.findByRole("combobox", { name: "Scene order" });
    expect(
      await screen.findByRole("status", { name: "Loading scenes" }),
    ).toBeInTheDocument();
    await screen.findByText(/Scene service unavailable/);
    expect(screen.getByRole("combobox", { name: "Scene order" })).toBe(order);
    expect(screen.getByRole("heading", { name: "Scenes" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No results")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Scene order" })).toBe(order);
  });
});
