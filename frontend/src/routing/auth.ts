import {
  type ApolloClient,
  CombinedGraphQLErrors,
  ServerError,
} from "@apollo/client";
import { MeDocument } from "src/graphql";

export async function loadCurrentUser(client: ApolloClient) {
  try {
    const { data } = await client.query({
      query: MeDocument,
      fetchPolicy: "cache-first",
    });
    return data?.me ?? undefined;
  } catch (error) {
    const unauthorized =
      (CombinedGraphQLErrors.is(error) &&
        error.errors.every(({ message }) => message === "not authorized")) ||
      (ServerError.is(error) && error.statusCode === 401);
    if (!unauthorized) throw error;

    // The API reports anonymous sessions as an error. Cache the logged-out state
    // so the layout and subsequent public routes do not repeat the same query.
    client.writeQuery({
      query: MeDocument,
      data: { __typename: "Query", me: null },
    });
    return undefined;
  }
}
