import { ApolloProvider } from "@apollo/client/react";
import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import { RouterProvider } from "@tanstack/react-router";
import type { FC } from "react";
import { createAppRouter } from "src/routing/router";
import createClient from "src/utils/createClient";

fontAwesomeConfig.autoAddCss = false;

import "./App.scss";
import "@fortawesome/fontawesome-svg-core/styles.css";

const client = createClient();
const router = createAppRouter(client);

const App: FC = () => (
  <ApolloProvider client={client}>
    <RouterProvider router={router} />
  </ApolloProvider>
);

export default App;
