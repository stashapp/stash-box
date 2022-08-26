import { FC } from "react";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter, Route } from "react-router-dom";

import Main from "src/Main";
import createClient from "src/utils/createClient";
import Pages from "src/pages";
import Title from "src/components/title";
import { ToastProvider } from "src/hooks/useToast";

import "./App.scss";

const client = createClient();

const App: FC = () => (
  <ApolloProvider client={client}>
    <BrowserRouter>
      <ToastProvider>
        <Route path="/">
          <Main>
            <Title />
            <Pages />
          </Main>
        </Route>
      </ToastProvider>
    </BrowserRouter>
  </ApolloProvider>
);

export default App;
