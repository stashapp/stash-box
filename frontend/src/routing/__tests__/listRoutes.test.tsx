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
import { makeRoutingTagMock } from "lib/test/mocks/routing";
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

describe("component-owned lists", () => {
  it("passes URL filters to the scene query in the mounted list", async () => {
    const context = createRoutingTestContext(
      "/scenes?page=-3&sort=title&dir=asc&favorite=performer&fingerprint=001234&tag=tag-1",
      {
        user: makeRoutingUser(),
        mocks: [
          configMock,
          makeRoutingTagMock(),
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
    renderRoutingTest(context);
    await screen.findByText("1 results");
    const sceneQueries = () =>
      watch.mock.calls.filter(([options]) => options.query === ScenesDocument);
    expect(sceneQueries()).toHaveLength(1);
    act(() => {
      void context.router.navigate({
        to: ".",
        search: (previous) => ({ ...previous, unrelated: "layout" }),
        hash: "preview",
      });
    });
    await waitFor(() =>
      expect(context.router.state.location.hash).toBe("preview"),
    );
    expect(sceneQueries()).toHaveLength(1);
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
      (await screen.findAllByRole("status", { name: "Updating results" }))[0],
    ).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")[0]).toBe(order);
    await waitFor(() =>
      expect(
        screen.queryAllByRole("status", { name: "Updating results" }),
      ).toHaveLength(0),
    );
    expect(
      watch.mock.calls.filter(([options]) => options.query === EditsDocument),
    ).toHaveLength(1);
    expect(
      context.client.readQuery({
        query: EditsDocument,
        variables: {
          input: {
            ...watch.mock.calls[0][0].variables?.input,
            sort: EditSortEnum.CLOSED_AT,
          },
        },
      }),
    ).toMatchObject({ queryEdits: makeEmptyEditsResult().queryEdits });
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
