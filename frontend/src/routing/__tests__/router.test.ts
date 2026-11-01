import { ApolloClient, InMemoryCache, ServerError } from "@apollo/client";
import { MockLink } from "@apollo/client/testing";
import { createMemoryHistory } from "@tanstack/react-router";
import { createRoutingTestContext as setup } from "lib/test/appRouter";
import {
  makeSceneCountResult,
  makeScenesResult,
} from "lib/test/fixtures/lists";
import { makeRoutingTag, makeRoutingUser } from "lib/test/fixtures/routing";
import { makeRoutingTagMock } from "lib/test/mocks/routing";
import {
  MeDocument,
  PublicUserDocument,
  RoleEnum,
  SceneCountDocument,
  ScenesDocument,
  TagDocument,
  UserDocument,
} from "src/graphql";
import { createAppRouter } from "src/routing/router";
import { parseSearch, stringifySearch } from "src/routing/search";
import { describe, expect, it, vi } from "vitest";

describe("code-based router", () => {
  it("fills Apollo once and keeps mutations authoritative across detail/edit navigation", async () => {
    const { client, router } = setup("/tags/tag-1", {
      user: makeRoutingUser(),
      mocks: [makeRoutingTagMock()],
    });
    const query = vi.spyOn(client, "watchQuery");
    await router.load();
    expect(
      router.state.matches.every((match) => match.status === "success"),
    ).toBe(true);
    expect(
      client.readQuery({ query: TagDocument, variables: { id: "tag-1" } }),
    ).toMatchObject({ findTag: makeRoutingTag().findTag });

    client.writeQuery({
      query: TagDocument,
      variables: { id: "tag-1" },
      data: makeRoutingTag({ name: "Updated" }),
    });
    await router.navigate({ to: "/tags/$id/edit", params: { id: "tag-1" } });
    expect(
      client.readQuery({ query: TagDocument, variables: { id: "tag-1" } })
        ?.findTag?.name,
    ).toBe("Updated");
    // Both loader calls use Apollo's cache-first policy; the one network mock suffices.
    expect(
      query.mock.calls.filter(([options]) => options.query === TagDocument)
        .length,
    ).toBeGreaterThan(0);
    expect(
      router.state.matches.every((match) => match.status === "success"),
    ).toBe(true);
  });

  it.each([
    {
      path: "/users/Other",
      viewer: makeRoutingUser(),
      expected: PublicUserDocument,
    },
    {
      path: "/users/Viewer",
      viewer: makeRoutingUser(),
      expected: UserDocument,
    },
    {
      path: "/admin/users/Other/edit",
      viewer: makeRoutingUser({
        id: "admin",
        name: "Admin",
        roles: [RoleEnum.ADMIN],
      }),
      expected: UserDocument,
    },
  ])("selects the appropriate profile query for $path", async ({
    path,
    viewer,
    expected,
  }) => {
    const name = path.includes("Other") ? "Other" : "Viewer";
    const { client, router } = setup(path, {
      user: viewer,
      mocks: [
        {
          request: { query: expected, variables: { name } },
          result: { data: { findUser: null } },
        },
      ],
    });
    const watch = vi.spyOn(client, "watchQuery");
    await router.load();
    expect(watch).toHaveBeenCalledTimes(1);
    expect(watch.mock.calls[0][0].query).toBe(expected);
  });

  it("preloads into Apollo and reuses that data on entry", async () => {
    const { client, router } = setup("/version", {
      user: makeRoutingUser(),
      mocks: [makeRoutingTagMock()],
    });
    await router.load();
    await router.preloadRoute({ to: "/tags/$id", params: { id: "tag-1" } });
    expect(
      client.readQuery({ query: TagDocument, variables: { id: "tag-1" } }),
    ).toMatchObject({ findTag: makeRoutingTag().findTag });
    await router.navigate({ to: "/tags/$id", params: { id: "tag-1" } });
    expect(
      router.state.matches.every((match) => match.status === "success"),
    ).toBe(true);
  });

  it("redirects guests before the entity query and preserves search/hash", async () => {
    const { client, router } = setup("/tags/tag-1?sort=name#edits", {
      user: {
        __typename: "Query",
        me: null,
      },
      mocks: [makeRoutingTagMock()],
    });
    const query = vi.spyOn(client, "watchQuery");
    await router.load();
    expect(router.state.location.pathname).toBe("/login");
    expect(router.state.location.search.redirect).toBe(
      "/tags/tag-1?sort=name#edits",
    );
    expect(
      query.mock.calls.filter(([options]) => options.query === TagDocument),
    ).toHaveLength(0);
  });

  it("rejects non-admin access before fetching admin entity data", async () => {
    const { client, router } = setup("/admin/sites/site-1/edit", {
      user: makeRoutingUser(),
    });
    const query = vi.spyOn(client, "watchQuery");
    await router.load();
    expect(
      router.state.matches.some(
        (match) =>
          match.status === "error" &&
          match.error instanceof Error &&
          match.error.message.includes("Administrator"),
      ),
    ).toBe(true);
    expect(query).not.toHaveBeenCalled();
  });

  it("keeps repeated filters, hash-only changes, and replace history compatible", async () => {
    const { router, history } = setup(
      "/scenes?studio=a&studio=b&page=2#fingerprints",
      {
        user: makeRoutingUser(),
        mocks: [
          {
            request: { query: ScenesDocument, variables: () => true },
            result: { data: makeScenesResult() },
            maxUsageCount: 4,
          },
          {
            request: { query: SceneCountDocument, variables: () => true },
            result: { data: makeSceneCountResult() },
            maxUsageCount: 4,
          },
        ],
      },
    );
    await router.load();
    expect(
      router.state.matches.every((match) => match.status === "success"),
    ).toBe(true);
    expect(router.state.location.search).toMatchObject({
      studio: ["a", "b"],
      page: "2",
    });
    const length = history.length;
    await router.navigate({
      to: ".",
      search: { studio: ["a", "b"], page: "3" },
      hash: true,
      replace: true,
    });
    expect(history.length).toBe(length);
    expect(router.state.location.hash).toBe("fingerprints");
    await router.navigate({ hash: "edits", search: true });
    expect(Number(router.state.location.search.page)).toBe(3);
    expect(router.state.location.hash).toBe("edits");
    await router.navigate({ to: "/version" });
    history.back();
    await router.load();
    expect(router.state.location.pathname).toBe("/scenes");
    expect(router.state.location.hash).toBe("edits");
    history.forward();
    await router.load();
    expect(router.state.location.pathname).toBe("/version");
  });

  it("encodes path params and search values without changing their content", () => {
    const { router } = setup("/", { user: makeRoutingUser() });
    const destination = router.buildLocation({
      to: "/users/$name",
      params: { name: "A & B/%" },
    });
    expect(
      new URL(destination.publicHref, "https://example.test").pathname,
    ).toBe("/users/A%20%26%20B%2F%25");
    expect(
      router.matchRoutes(destination.pathname).at(-1)?.params,
    ).toMatchObject({ name: "A & B/%" });
    const search = {
      q: "A & B",
      fingerprint: "001234",
      aliases: ["First", "Second"],
    };
    expect(parseSearch(stringifySearch(search))).toEqual(search);
  });

  it("allows login after an HTTP 401 and caches the anonymous session", async () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([
        {
          request: { query: MeDocument },
          error: new ServerError("Unauthorized", {
            response: new Response(null, { status: 401 }),
            bodyText: "",
          }),
        },
      ]),
    });
    const router = createAppRouter(
      client,
      createMemoryHistory({ initialEntries: ["/login"] }),
    );
    await router.load();
    expect(
      router.state.matches.every((match) => match.status === "success"),
    ).toBe(true);
    expect(client.readQuery({ query: MeDocument })?.me).toBeNull();
    await router.navigate({ to: "/register" });
    expect(
      router.state.matches.every((match) => match.status === "success"),
    ).toBe(true);
    client.stop();
  });

  it("keeps real network failures retryable instead of treating them as logout", async () => {
    const client = new ApolloClient({
      cache: new InMemoryCache(),
      link: new MockLink([
        {
          request: { query: MeDocument },
          error: new Error("Network unavailable"),
        },
        { request: { query: MeDocument }, result: { data: makeRoutingUser() } },
      ]),
    });
    const router = createAppRouter(
      client,
      createMemoryHistory({ initialEntries: ["/version"] }),
    );
    await router.load();
    expect(router.state.matches.some((match) => match.status === "error")).toBe(
      true,
    );
    expect(router.state.location.pathname).toBe("/version");
    await router.invalidate();
    expect(
      router.state.matches.every((match) => match.status === "success"),
    ).toBe(true);
    client.stop();
  });

  it("preserves the deployment base path when redirecting guests back after login", async () => {
    const { router } = setup("/box/scenes?sort=name#edits", {
      user: {
        __typename: "Query",
        me: null,
      },
    });
    router.update({ basepath: "/box", context: router.options.context });
    await router.load();
    expect(router.state.location.publicHref).toContain("/box/login");
    expect(router.state.location.search.redirect).toBe(
      "/box/scenes?sort=name#edits",
    );
  });

  it("supports public and protected routes under a deployment base path", async () => {
    const { router } = setup("/box/login", {
      user: {
        __typename: "Query",
        me: null,
      },
    });
    router.update({ basepath: "/box", context: router.options.context });
    await router.load();
    expect(router.state.location.pathname).toBe("/login");
    expect(
      router.state.matches.every((match) => match.status === "success"),
    ).toBe(true);
    expect(router.buildLocation({ to: "/scenes" }).publicHref).toBe(
      "/box/scenes",
    );
  });
});
