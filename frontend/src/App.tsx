import React from "react";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter, Route } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";

import Main from "src/Main";
import createClient from "src/utils/createClient";
import Pages from "src/pages";

import "./App.scss";

// Set fontawesome/free-solid-svg as default fontawesome icons
library.add(fas);

const client = createClient();

const App: React.FC = () => (
  <ApolloProvider client={client}>
    <BrowserRouter>
      <Route path="/">
        <Main>
          <Pages />
        </Main>
      </Route>
    </BrowserRouter>
  </ApolloProvider>
);

export default App;
