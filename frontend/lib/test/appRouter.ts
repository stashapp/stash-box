import { ApolloClient, InMemoryCache } from "@apollo/client";
import { type MockedResponse, MockLink } from "@apollo/client/testing";
import { createMemoryHistory } from "@tanstack/react-router";
import { makeCurrentUserMock } from "lib/test/mocks/routing";
import type { MeQuery } from "src/graphql";
import { createAppRouter } from "src/routing/router";
import { onTestFinished } from "vitest";

export function createRoutingTestContext(
  path: string,
  {
    user,
    mocks = [],
  }: { user: MeQuery; mocks?: ReadonlyArray<MockedResponse> },
) {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new MockLink([makeCurrentUserMock(user), ...mocks]),
  });
  onTestFinished(() => client.stop());
  const history = createMemoryHistory({ initialEntries: [path] });
  const router = createAppRouter(client, history);
  return { client, router, history };
}
