import { type MeQuery, RoleEnum, type TagQuery } from "src/graphql";

export function makeRoutingUser(
  overrides: Partial<NonNullable<MeQuery["me"]>> = {},
) {
  return {
    __typename: "Query",
    me: {
      __typename: "User",
      id: "viewer",
      name: "Viewer",
      roles: [RoleEnum.READ],
      ...overrides,
    },
  } satisfies MeQuery;
}

export function makeRoutingTag(
  overrides: Partial<NonNullable<TagQuery["findTag"]>> = {},
) {
  return {
    __typename: "Query",
    findTag: {
      __typename: "Tag",
      id: "tag-1",
      name: "Original",
      description: null,
      aliases: [],
      deleted: false,
      category: null,
      ...overrides,
    },
  } satisfies TagQuery;
}
