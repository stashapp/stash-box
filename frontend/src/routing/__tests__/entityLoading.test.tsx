import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutingTestContext } from "lib/test/appRouter";
import {
  makeRoutingCategory,
  makeRoutingTag,
  makeRoutingUser,
} from "lib/test/fixtures/routing";
import { makeRoutingTagMock } from "lib/test/mocks/routing";
import { renderRoutingTest } from "lib/test/render";
import {
  CategoryDocument,
  DeleteTagCategoryDocument,
  RoleEnum,
  TagDocument,
  UpdateTagCategoryDocument,
} from "src/graphql";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("src/Main", async () => ({
  default: (await import("lib/test/stubs/ContentOnly")).ContentOnly,
}));
vi.mock("src/components/title", () => ({ default: () => null }));
vi.mock("src/pages/tags/Tag", () => import("lib/test/stubs/TagView"));
vi.mock(
  "src/pages/categories/Category",
  () => import("lib/test/stubs/CategoryView"),
);

afterEach(() => vi.restoreAllMocks());

describe("entity query-reference loaders", () => {
  it("shows a pending skeleton, then reads the loader reference without another watched query", async () => {
    const context = createRoutingTestContext("/tags/tag-1", {
      user: makeRoutingUser(),
      mocks: [
        {
          request: { query: TagDocument, variables: { id: "tag-1" } },
          result: { data: makeRoutingTag() },
          delay: 350,
        },
      ],
    });
    const watch = vi.spyOn(context.client, "watchQuery");
    renderRoutingTest(context);
    expect(
      await screen.findByRole("status", { name: "Loading tag" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Original" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Original" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: "Loading tag" }),
    ).not.toBeInTheDocument();
    expect(
      watch.mock.calls.filter(([options]) => options.query === TagDocument),
    ).toHaveLength(1);
  });

  it("updates the rendered entity after an explicit Apollo cache write", async () => {
    const context = createRoutingTestContext("/tags/tag-1", {
      user: makeRoutingUser(),
      mocks: [makeRoutingTagMock()],
    });
    renderRoutingTest(context);
    await screen.findByRole("heading", { name: "Original" });
    act(() =>
      context.client.writeQuery({
        query: TagDocument,
        variables: { id: "tag-1" },
        data: makeRoutingTag({ name: "Updated" }),
      }),
    );
    expect(
      await screen.findByRole("heading", { name: "Updated" }),
    ).toBeInTheDocument();
  });

  it("reruns invalidated loaders from cache and fetches server changes only on Apollo refetch", async () => {
    const serverResult = vi.fn(() => ({
      data: makeRoutingTag({ name: "Server update" }),
    }));
    const context = createRoutingTestContext("/tags/tag-1", {
      user: makeRoutingUser(),
      mocks: [
        {
          request: { query: TagDocument, variables: { id: "tag-1" } },
          result: serverResult,
        },
      ],
    });
    context.client.writeQuery({
      query: TagDocument,
      variables: { id: "tag-1" },
      data: makeRoutingTag(),
    });
    const watch = vi.spyOn(context.client, "watchQuery");
    renderRoutingTest(context);
    await screen.findByRole("heading", { name: "Original" });
    const initialWatches = watch.mock.calls.filter(
      ([options]) => options.query === TagDocument,
    ).length;

    let invalidated = false;
    act(() => {
      void context.router.invalidate({ sync: true }).then(() => {
        invalidated = true;
      });
    });
    await waitFor(() => expect(invalidated).toBe(true));

    expect(
      watch.mock.calls.filter(([options]) => options.query === TagDocument)
        .length,
    ).toBeGreaterThan(initialWatches);
    expect(serverResult).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Original" }),
    ).toBeInTheDocument();

    await act(async () => {
      await context.client.refetchQueries({ include: [TagDocument] });
    });

    expect(
      await screen.findByRole("heading", { name: "Server update" }),
    ).toBeInTheDocument();
    expect(serverResult).toHaveBeenCalledTimes(1);
  });

  it("reflects normalized mutation fields without another entity query", async () => {
    const initialCategory = vi.fn(() => ({ data: makeRoutingCategory() }));
    const categoryData = { id: "category-1", name: "Updated category" };
    const updated = makeRoutingCategory({ name: categoryData.name });
    const context = createRoutingTestContext("/categories/category-1", {
      user: makeRoutingUser({ roles: [RoleEnum.ADMIN] }),
      mocks: [
        {
          request: { query: CategoryDocument, variables: { id: "category-1" } },
          result: initialCategory,
        },
        {
          request: {
            query: UpdateTagCategoryDocument,
            variables: { categoryData },
          },
          result: { data: { tagCategoryUpdate: updated.findTagCategory } },
        },
      ],
    });
    const invalidate = vi.spyOn(context.router, "invalidate");
    renderRoutingTest(context);
    await screen.findByRole("heading", { name: "Original category" });

    await act(async () => {
      await context.client.mutate({
        mutation: UpdateTagCategoryDocument,
        variables: { categoryData },
      });
    });

    expect(
      await screen.findByRole("heading", { name: "Updated category" }),
    ).toBeInTheDocument();
    expect(initialCategory).toHaveBeenCalledTimes(1);
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("refetches an entity after a scalar deletion result and renders the missing state", async () => {
    const missingCategory = vi.fn(() => ({ data: { findTagCategory: null } }));
    const variables = { input: { id: "category-1" } };
    const context = createRoutingTestContext("/categories/category-1", {
      user: makeRoutingUser({ roles: [RoleEnum.ADMIN] }),
      mocks: [
        {
          request: { query: CategoryDocument, variables: { id: "category-1" } },
          result: { data: makeRoutingCategory() },
        },
        {
          request: { query: DeleteTagCategoryDocument, variables },
          result: { data: { tagCategoryDestroy: true } },
        },
        {
          request: { query: CategoryDocument, variables: { id: "category-1" } },
          result: missingCategory,
        },
      ],
    });
    renderRoutingTest(context);
    await screen.findByRole("heading", { name: "Original category" });

    await act(async () => {
      await context.client.mutate({
        mutation: DeleteTagCategoryDocument,
        variables,
        refetchQueries: [
          { query: CategoryDocument, variables: { id: "category-1" } },
        ],
        awaitRefetchQueries: true,
      });
    });

    expect(await screen.findByText(/Category not found\./)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Original category" }),
    ).not.toBeInTheDocument();
    expect(missingCategory).toHaveBeenCalledTimes(1);
  });

  it("resolves missing entities to the route's not-found view", async () => {
    const context = createRoutingTestContext("/tags/tag-1", {
      user: makeRoutingUser(),
      mocks: [
        {
          request: { query: TagDocument, variables: { id: "tag-1" } },
          result: { data: { findTag: null } },
        },
      ],
    });
    renderRoutingTest(context);
    expect(await screen.findByText(/Tag not found/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Original" }),
    ).not.toBeInTheDocument();
  });

  it("retries a failed blocking query through the route error boundary", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const context = createRoutingTestContext("/tags/tag-1", {
      user: makeRoutingUser(),
      mocks: [
        {
          request: { query: TagDocument, variables: { id: "tag-1" } },
          error: new Error("Tag service unavailable"),
        },
        {
          request: { query: TagDocument, variables: { id: "tag-1" } },
          result: { data: makeRoutingTag() },
        },
      ],
    });
    renderRoutingTest(context);
    await screen.findByText(/Tag service unavailable/);
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(
      await screen.findByRole("heading", { name: "Original" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByText(/Tag service unavailable/),
      ).not.toBeInTheDocument(),
    );
  });
});
