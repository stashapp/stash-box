import type { MockedResponse } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import { type RenderOptions, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import AuthContext, { type ContextType } from "src/context";

interface RenderFormOptions extends Omit<RenderOptions, "wrapper"> {
  route?: string;
  mocks?: ReadonlyArray<MockedResponse>;
  auth?: ContextType;
}

const defaultAuth: ContextType = { authenticated: false };

export const renderForm = (
  ui: ReactElement,
  {
    route = "/",
    mocks = [],
    auth = defaultAuth,
    ...options
  }: RenderFormOptions = {},
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <MockedProvider mocks={mocks as MockedResponse[]}>
      <AuthContext.Provider value={auth}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </AuthContext.Provider>
    </MockedProvider>
  );

  const user = userEvent.setup();
  const utils = render(ui, { wrapper: Wrapper, ...options });
  return { user, ...utils };
};

export { userEvent };
