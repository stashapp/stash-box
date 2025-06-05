import { FC } from "react";
import { ApolloProvider } from "@apollo/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";

import Main from "src/Main";
import createClient from "src/utils/createClient";
import Pages from "src/pages";
import Title from "src/components/title";
import { ToastProvider } from "src/hooks/useToast";

fontAwesomeConfig.autoAddCss = false;

import "./App.scss";
import "node_modules/@fortawesome/fontawesome-svg-core/styles.css";

const client = createClient();

const App: FC = () => (
  <ApolloProvider client={client}>
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route
            path="/*"
            element={
              <Main>
                <Title />
                <Pages />
              </Main>
            }
          />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  </ApolloProvider>
);

export default App;
