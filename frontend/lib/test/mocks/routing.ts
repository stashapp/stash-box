import type { MockedResponse } from "@apollo/client/testing";
import { makeRoutingTag } from "lib/test/fixtures/routing";
import {
  MeDocument,
  type MeQuery,
  TagDocument,
  type TagQuery,
} from "src/graphql";

export const makeCurrentUserMock = (user: MeQuery): MockedResponse => ({
  request: { query: MeDocument },
  result: {
    data: user,
    ...(user.me ? {} : { errors: [{ message: "not authorized" }] }),
  },
});

export const makeRoutingTagMock = (
  data: TagQuery = makeRoutingTag(),
): MockedResponse => ({
  request: { query: TagDocument, variables: { id: "tag-1" } },
  result: { data },
});
