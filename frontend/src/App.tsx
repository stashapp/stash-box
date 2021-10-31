import React from "react";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter, Route } from "react-router-dom";

import Main from "src/Main";
import createClient from "src/utils/createClient";
import Pages from "src/pages";
import Title from "src/components/title";

import "./App.scss";

const client = createClient();

const App: React.FC = () => (
  <ApolloProvider client={client}>
    <BrowserRouter>
      <Route path="/">
        <Main>
          <Title />
          <Pages />
        </Main>
      </Route>
    </BrowserRouter>
  </ApolloProvider>
);

export default App;
