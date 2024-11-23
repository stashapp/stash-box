import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  TypePolicies,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { removeTypenameFromVariables } from "@apollo/client/link/remove-typename";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";

const typePolicies: TypePolicies = {
  SceneDraft: {
    keyFields: false,
  },
  PerformerDraft: {
    keyFields: false,
  },
};

const isDevEnvironment = () => import.meta.env.DEV;

export const getCredentialsSetting = () =>
  isDevEnvironment() && !import.meta.env.VITE_SERVER_URL
    ? "include"
    : "same-origin";

export const getPlatformURL = () => {
  let platformUrl = new URL(window.location.origin);

  if (isDevEnvironment()) {
    platformUrl = new URL(
      import.meta.env.VITE_SERVER_URL ?? window.location.origin,
    );
    platformUrl.port = import.meta.env.VITE_SERVER_PORT ?? "9998";
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  headers: {
    ...headers,
    ...(import.meta.env.VITE_APIKEY && {
      ApiKey: import.meta.env.VITE_APIKEY,
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
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
            ),
          );
        if (networkError) console.log(`[Network error]: ${networkError}`);
      }),
      removeTypenameFromVariables(),
      httpLink as unknown as ApolloLink,
    ]),
    cache: new InMemoryCache({ typePolicies }),
  });

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export default createClient;
