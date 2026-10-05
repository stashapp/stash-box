import type { MockedResponse } from "@apollo/client/testing";
import {
  type GenderEnum,
  type SearchPerformersQueryVariables,
  type SearchTagsQueryVariables,
  type StudiosQueryVariables,
  TagGroupEnum,
  ValidSiteTypeEnum,
} from "src/graphql";
import CategoriesGQL from "src/graphql/queries/Categories.gql";
// Import .gql sources directly so the mock matches the AST that the
// components import (via vite-plugin-graphql-loader) at runtime.
import ConfigGQL from "src/graphql/queries/Config.gql";
import SearchPerformersGQL from "src/graphql/queries/SearchPerformers.gql";
import SearchTagsGQL from "src/graphql/queries/SearchTags.gql";
import SiteCategoriesGQL from "src/graphql/queries/SiteCategories.gql";
import SitesGQL from "src/graphql/queries/Sites.gql";
import StudiosGQL from "src/graphql/queries/Studios.gql";

export const configMock: MockedResponse = {
  request: { query: ConfigGQL },
  result: {
    data: {
      getConfig: {
        edit_update_limit: 0,
        host_url: "",
        require_invite: false,
        require_activation: false,
        vote_promotion_threshold: 0,
        vote_application_threshold: 0,
        voting_period: 0,
        min_destructive_voting_period: 0,
        vote_cron_interval: "",
        guidelines_url: "",
        require_scene_draft: false,
        require_tag_role: false,
      },
    },
  },
};

export const categoriesMock: MockedResponse = {
  request: { query: CategoriesGQL },
  result: {
    data: {
      queryTagCategories: {
        count: 2,
        tag_categories: [
          {
            id: "cat-1",
            name: "Activity",
            description: null,
            group: TagGroupEnum.ACTION,
          },
          {
            id: "cat-2",
            name: "Other",
            description: null,
            group: TagGroupEnum.SCENE,
          },
        ],
      },
    },
  },
};

export const STUB_SITES = [
  {
    id: "site-perf-1",
    name: "PerfSite",
    description: null,
    url: "",
    regex: null,
    valid_types: [ValidSiteTypeEnum.PERFORMER],
    icon: "icon",
    created: "2024-01-01",
    updated: "2024-01-01",
  },
  {
    id: "site-scene-1",
    name: "SceneSite",
    description: null,
    url: "",
    regex: null,
    valid_types: [ValidSiteTypeEnum.SCENE],
    icon: "icon",
    created: "2024-01-01",
    updated: "2024-01-01",
  },
  {
    id: "site-studio-1",
    name: "StudioSite",
    description: null,
    url: "",
    regex: null,
    valid_types: [ValidSiteTypeEnum.STUDIO],
    icon: "icon",
    created: "2024-01-01",
    updated: "2024-01-01",
  },
];

export const sitesMock: MockedResponse = {
  request: { query: SitesGQL },
  result: { data: { querySites: { sites: STUB_SITES } } },
};

export const siteCategoriesMock: MockedResponse = {
  request: { query: SiteCategoriesGQL },
  result: {
    data: {
      querySiteCategories: {
        count: 0,
        site_categories: [],
      },
    },
  },
};

export interface StudioSearchResult {
  id: string;
  name: string;
  parentId?: string | null;
  parentName?: string | null;
}

/** Mock for a studio name search returning the given results. */
export const studioSearchMock = (
  term: string,
  results: StudioSearchResult[],
): MockedResponse => ({
  request: {
    query: StudiosGQL,
    variables: (vars: StudiosQueryVariables) => vars.input.name === term,
  },
  result: {
    data: {
      queryStudios: {
        count: results.length,
        studios: results.map((s) => ({
          id: s.id,
          name: s.name,
          aliases: [],
          deleted: false,
          parent:
            s.parentId && s.parentName
              ? { id: s.parentId, name: s.parentName }
              : null,
          urls: [],
          images: [],
          is_favorite: false,
        })),
      },
    },
  },
});

export interface TagSearchResult {
  id: string;
  name: string;
  aliases?: string[];
  description?: string | null;
}

export const tagSearchMock = (
  term: string,
  results: TagSearchResult[],
): MockedResponse => ({
  request: {
    query: SearchTagsGQL,
    variables: (vars: SearchTagsQueryVariables) => vars.term === term,
  },
  result: {
    data: {
      exact: null,
      query: results.map((r) => ({
        __typename: "Tag" as const,
        id: r.id,
        name: r.name,
        deleted: false,
        description: r.description ?? null,
        aliases: r.aliases ?? [],
      })),
    },
  },
});

export interface PerformerSearchResult {
  id: string;
  name: string;
  gender?: GenderEnum | null;
  disambiguation?: string | null;
  aliases?: string[];
  deleted?: boolean;
}

export const performerSearchMock = (
  term: string,
  results: PerformerSearchResult[],
): MockedResponse => ({
  request: {
    query: SearchPerformersGQL,
    variables: (vars: SearchPerformersQueryVariables) => vars.term === term,
  },
  result: {
    data: {
      searchPerformers: {
        count: results.length,
        performers: results.map((p) => ({
          __typename: "Performer" as const,
          id: p.id,
          name: p.name,
          gender: p.gender ?? null,
          disambiguation: p.disambiguation ?? null,
          aliases: p.aliases ?? [],
          deleted: p.deleted ?? false,
          country: null,
          career_start_year: null,
          career_end_year: null,
          scene_count: 0,
          birth_date: null,
          urls: [],
          images: [],
          is_favorite: false,
        })),
        facets: { genders: [] },
      },
    },
  },
});
