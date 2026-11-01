import { InMemoryCache, type TypePolicies } from "@apollo/client";

const typePolicies: TypePolicies = {
  SceneDraft: {
    keyFields: false,
  },
  PerformerDraft: {
    keyFields: false,
  },
  Studio: {
    fields: {
      sub_studios: {
        keyArgs: ["input"],
      },
    },
  },
  Query: {
    fields: {
      // Records and counts are fetched separately for the same query arguments.
      queryScenes: { merge: true },
      findImage: {
        read(_, { args, toReference }) {
          return toReference({ __typename: "Image", id: args?.id });
        },
      },
      findStudio: {
        merge: true,
      },
    },
  },
};

export const createCache = () => new InMemoryCache({ typePolicies });
