/* eslint-disable no-console */
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';

const httpLink = createHttpLink({
    uri: process.env.GRAPHQL_ENDPOINT
});

const authLink = setContext((_, { headers }) => {
    // get the authentication token from local storage if it exists
    const token = localStorage.getItem('token');
    // return the headers to the context so httpLink can read them
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : '',
        }
    };
});

const createClient = () => (
    new ApolloClient({
        link: ApolloLink.from([
            authLink,
            onError(({ graphQLErrors, networkError }) => {
                if (graphQLErrors)
                    graphQLErrors.forEach(({ message, locations, path }) =>
                        console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`));
                if (networkError) console.log(`[Network error]: ${networkError}`);
            }),
            httpLink
        ]),
        cache: new InMemoryCache({
            dataIdFromObject: object => (object as { uuid?: string}).uuid || null
        })
    })
);

export const setToken = (token: string) => {
    localStorage.setItem('token', token);
};

export default createClient;
