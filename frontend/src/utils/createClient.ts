import {
  ApolloClient,
  InMemoryCache,
  ApolloLink,
  type TypePolicies,
} from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { CombinedGraphQLErrors, ServerError } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { RemoveTypenameFromVariablesLink } from "@apollo/client/link/remove-typename";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";

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

const httpLink = new UploadHttpLink({
  uri: `${getPlatformURL().toString().slice(0, -1)}/graphql`,
  fetchOptions: {
    mode: "cors",
    credentials: getCredentialsSetting(),
  },
});

const authLink = new SetContextLink(({ headers, ...context }) => ({
  headers: {
    ...headers,
    ...(import.meta.env.VITE_APIKEY && {
      ApiKey: import.meta.env.VITE_APIKEY,
    }),
  },
  ...context,
}));

const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message }) => {
      console.log(`GraphQL error: ${message}`);
    });
  } else if (ServerError.is(error)) {
    console.log(`Server error: ${error.message}`);
  } else if (error) {
    console.log(`Other error: ${error.message}`);
  }
});

const createClient = () =>
  new ApolloClient({
    link: ApolloLink.from([
      authLink,
      errorLink,
      new RemoveTypenameFromVariablesLink(),
      httpLink,
    ]),
    cache: new InMemoryCache({ typePolicies }),
  });

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export default createClient;
