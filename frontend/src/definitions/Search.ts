/* tslint:disable */
/* eslint-disable */
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL mutation operation: Search
// ====================================================

export interface Search_search_performers {
  uuid: any;
  id: number;
  name: string;
  birthdate: any | null;
  birthday: string | null;
  displayName: string;
  disambiguation: string;
  photoUrl: string | null;
  gender: string;
  aliases: string[] | null;
}

export interface Search_search_scenes_studio {
  id: number;
  title: string;
  uuid: any;
}

export interface Search_search_scenes_performers_performer {
  name: string;
  displayName: string;
  uuid: any;
  id: number;
  gender: string;
}

export interface Search_search_scenes_performers {
  alias: string | null;
  performer: Search_search_scenes_performers_performer;
}

export interface Search_search_scenes {
  id: number;
  uuid: any;
  title: string | null;
  date: any | null;
  dateAccuracy: number | null;
  photoUrl: string | null;
  studio: Search_search_scenes_studio;
  performers: Search_search_scenes_performers[];
}

export interface Search_search {
  performers: Search_search_performers[];
  scenes: Search_search_scenes[];
}

export interface Search {
  search: Search_search;
}

export interface SearchVariables {
  term: string;
  searchType: string;
}
