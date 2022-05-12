import { ApolloClient, InMemoryCache, ApolloLink } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { setContext, ContextSetter } from "@apollo/client/link/context";
import { createUploadLink } from "apollo-upload-client";

const isDevEnvironment = () => import.meta.env.DEV;

export const getCredentialsSetting = () =>
  isDevEnvironment() ? "include" : "same-origin";

export const getPlatformURL = () => {
  const platformUrl = new URL(window.location.origin);

  if (isDevEnvironment())
    platformUrl.port = import.meta.env.VITE_SERVER_PORT ?? "9998";

  return platformUrl;
};

const httpLink = createUploadLink({
  uri: `${getPlatformURL().toString().slice(0, -1)}/graphql`,
  fetchOptions: {
    mode: "cors",
    credentials: getCredentialsSetting(),
  },
});

const authLink = setContext(
  (_, { headers, ...context }): ContextSetter => ({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    headers: {
      ...headers,
      ...(import.meta.env.VITE_APIKEY && {
        ApiKey: import.meta.env.VITE_APIKEY,
      }),
    },
    ...context,
  })
);

const createClient = () =>
  new ApolloClient({
    link: ApolloLink.from([
      authLink,
      onError(({ graphQLErrors, networkError }) => {
        /* eslint-disable no-console */
        if (graphQLErrors)
          graphQLErrors.forEach(({ message, locations, path }) =>
            console.log(
              `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
          );
        if (networkError) console.log(`[Network error]: ${networkError}`);
        /* eslint-enable no-console */
      }),
      httpLink as unknown as ApolloLink,
    ]),
    cache: new InMemoryCache(),
  });

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export default createClient;
