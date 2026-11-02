import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRoutingTestContext } from "lib/test/appRouter";
import { makeRoutingTag, makeRoutingUser } from "lib/test/fixtures/routing";
import { makeRoutingTagMock } from "lib/test/mocks/routing";
import { renderRoutingTest } from "lib/test/render";
import { TagDocument } from "src/graphql";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("src/Main", async () => ({
  default: (await import("lib/test/stubs/ContentOnly")).ContentOnly,
}));
vi.mock("src/components/title", () => ({ default: () => null }));
vi.mock("src/pages/tags/Tag", () => import("lib/test/stubs/TagView"));

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

  it("updates the rendered entity when a mutation changes Apollo's cache", async () => {
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
