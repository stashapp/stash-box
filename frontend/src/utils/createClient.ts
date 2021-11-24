/* eslint-disable no-console */

import { ApolloClient, InMemoryCache, ApolloLink } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { createUploadLink } from "apollo-upload-client";

const isDevEnvironment = () =>
  !process.env.NODE_ENV || process.env.NODE_ENV === "development";

export const getCredentialsSetting = () =>
  isDevEnvironment() ? "include" : "same-origin";

export const getPlatformURL = () => {
  const platformUrl = new URL(window.location.origin);

  if (isDevEnvironment()) {
    platformUrl.port = process.env.REACT_APP_SERVER_PORT ?? "9998";

    if (process.env.REACT_APP_HTTPS === "true") {
      platformUrl.protocol = "https:";
    }
  }

  return platformUrl;
};

const httpLink = createUploadLink({
  uri: `${getPlatformURL().toString().slice(0, -1)}/graphql`,
  fetchOptions: {
    mode: "cors",
    credentials: getCredentialsSetting(),
  },
});

const authLink = setContext((_, { headers, ...context }) => ({
  headers: {
    ...headers,
    ...(process.env.REACT_APP_APIKEY && {
      ApiKey: process.env.REACT_APP_APIKEY,
    }),
  },
  ...context,
}));

const createClient = () =>
  new ApolloClient({
    link: ApolloLink.from([
      authLink,
      onError(({ graphQLErrors, networkError }) => {
        if (graphQLErrors)
          graphQLErrors.forEach(({ message, locations, path }) =>
            console.log(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
          );
        if (networkError) console.log(`[Network error]: ${networkError}`);
      }),
      httpLink as unknown as ApolloLink,
    ]),
    cache: new InMemoryCache(),
  });

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export default createClient;
