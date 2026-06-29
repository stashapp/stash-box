import { ApolloProvider } from "@apollo/client/react";
import { config as fontAwesomeConfig } from "@fortawesome/fontawesome-svg-core";
import type { FC } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Title from "src/components/title";
import { ToastProvider } from "src/hooks/useToast";
import Main from "src/Main";
import Pages from "src/pages";
import createClient from "src/utils/createClient";

fontAwesomeConfig.autoAddCss = false;

import "./App.scss";
import "@fortawesome/fontawesome-svg-core/styles.css";

const client = createClient();

const App: FC = () => (
  <ApolloProvider client={client}>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
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
