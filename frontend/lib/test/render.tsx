import { ApolloProvider } from "@apollo/client/react";
import type { MockedResponse } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import { RouterProvider } from "@tanstack/react-router";
import { type RenderOptions, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type TestRoute, TestRouter } from "lib/test/router";
import type { ReactElement, ReactNode } from "react";
import AuthContext, { type ContextType } from "src/context";
import type { createRoutingTestContext } from "./appRouter";

interface RenderFormOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  routePath?: string;
  routes?: TestRoute[];
  mocks?: ReadonlyArray<MockedResponse>;
  auth?: ContextType;
}

const defaultAuth: ContextType = { authenticated: false };

export const renderForm = (
  ui: ReactElement,
  {
    route = "/",
    routePath,
    routes,
    mocks = [],
    auth = defaultAuth,
    ...options
  }: RenderFormOptions = {},
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks as MockedResponse[]}>
      <AuthContext.Provider value={auth}>
        <TestRouter
          initialEntries={[route]}
          routes={
            routePath
              ? [{ path: routePath, element: children }, ...(routes ?? [])]
              : routes
          }
        >
          {children}
        </TestRouter>
      </AuthContext.Provider>
    </MockedProvider>
  );

  const user = userEvent.setup();
  const utils = render(ui, { wrapper: Wrapper, ...options });
  return { user, ...utils };
};

export { userEvent };

export function renderRoutingTest({
  client,
  router,
}: ReturnType<typeof createRoutingTestContext>) {
  return render(
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>,
  );
}
