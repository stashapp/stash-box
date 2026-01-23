import { type FC, type KeyboardEvent, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client";
import {
  type OnChangeValue,
  components,
  type SelectInstance,
  type GroupBase,
} from "react-select";
import Async from "react-select/async";
import debounce from "p-debounce";
import { useNavigate } from "react-router-dom";

import SearchAllGQL from "src/graphql/queries/SearchAll.gql";
import SearchPerformersGQL from "src/graphql/queries/SearchPerformers.gql";

import type { SearchAllQuery, SearchPerformersQuery } from "src/graphql";
import {
  createHref,
  filterData,
  getImage,
  formatDisambiguation,
} from "src/utils";
import { ROUTE_SEARCH } from "src/constants/route";
import { GenderIcon, SearchHint, Thumbnail } from "src/components/fragments";

type SceneAllResult = NonNullable<SearchAllQuery["searchScene"][number]>;
type PerformerAllResult = NonNullable<
  SearchAllQuery["searchPerformer"][number]
>;
type PerformerOnlyResult = NonNullable<
  SearchPerformersQuery["searchPerformer"][number]
>;

export enum SearchType {
  Performer = "performer",
  Combined = "combined",
}

interface SearchFieldProps {
  onClick?: (result: SceneResult | PerformerResult) => void;
  onClickPerformer?: (result: PerformerResult) => void;
  searchType: SearchType;
  excludeIDs?: string[];
  nav?: boolean;
  placeholder?: string;
  showAllLink?: boolean;
  autoFocus?: boolean;
  /** When provided, performers who have performed for this studio's network will be sorted to the top */
  studioId?: string;
}

export type PerformerResult = PerformerAllResult | PerformerOnlyResult;
export type SceneResult = SceneAllResult;

interface SearchGroup {
  label: string;
  options: SearchResult[];
}
interface SearchResult {
  type: string;
  value?: SceneResult | PerformerResult;
  label?: string;
  sublabel?: string;
}

const ValueContainer: typeof components.ValueContainer = (props) => (
  <>
    <SearchHint />
    <components.ValueContainer {...props} />
  </>
);

const valueIsPerformer = (
  arg?: SceneResult | PerformerResult,
): arg is PerformerResult => arg?.__typename === "Performer";

const formatOptionLabel = ({ label, sublabel, value }: SearchResult) => (
  <div className="d-flex">
    {valueIsPerformer(value) && (
      <Thumbnail
        image={getImage(value.images, "portrait")}
        className="SearchField-thumb"
        alt={value.name}
        size={300}
        orientation="portrait"
      />
    )}
    <div>
      <div className="search-value">
        {valueIsPerformer(value) && <GenderIcon gender={value.gender} />}
        {value?.deleted ? <del>{label}</del> : label}
      </div>
      <div className="search-subvalue">{sublabel}</div>
    </div>
  </div>
);

const resultIsSearchAll = (
  arg: SearchAllQuery | SearchPerformersQuery,
): arg is SearchAllQuery =>
  (arg as SearchAllQuery).searchPerformer !== undefined &&
  (arg as SearchAllQuery).searchScene !== undefined;

const getStudioSceneCount = (performer: PerformerOnlyResult): number => {
  if ("studios" in performer && performer.studios?.length) {
    return performer.studios.reduce((sum, s) => sum + s.scene_count, 0);
  }
  return 0;
};

function handleResult(
  result: SearchAllQuery | SearchPerformersQuery,
  excludeIDs: string[],
  showAllLink: boolean,
  studioId?: string,
): (SearchGroup | SearchResult)[] {
  let performers: SearchResult[] = [];
  let scenes: SearchResult[] = [];

  if (resultIsSearchAll(result)) {
    const performerResults =
      result?.searchPerformer?.filter((p) => p !== null) ?? [];
    performers = performerResults
      .filter((performer) => !excludeIDs.includes(performer.id))
      .map((performer) => ({
        type: "performer",
        value: performer,
        label: `${performer.name}${formatDisambiguation(performer)}`,
        sublabel: [
          performer?.birth_date ? `Born: ${performer.birth_date}` : null,
          performer?.aliases.length
            ? `AKA: ${performer.aliases.join(", ")}`
            : null,
        ]
          .filter((p) => p !== null)
          .join(", "),
      }));

    const sceneResults = result?.searchScene?.filter((p) => p !== null) ?? [];
    scenes = sceneResults
      .filter((scene) => !excludeIDs.includes(scene.id))
      .map((scene) => ({
        type: "scene",
        value: scene,
        label: `${scene.title}${
          scene.release_date ? ` (${scene.release_date})` : ""
        }`,
        sublabel: filterData([
          scene?.studio?.name,
          scene?.code ? `Code ${scene.code}` : null,
          scene.performers
            ? scene.performers.map((p) => p.as || p.performer.name).join(", ")
            : null,
        ]).join(" • "),
      }));
  } else {
    const performerResults =
      result?.searchPerformer?.filter((p) => p !== null) ?? [];

    performers = performerResults
      .filter((performer) => !excludeIDs.includes(performer.id))
      .map((performer) => {
        const studioSceneCount = studioId ? getStudioSceneCount(performer) : 0;
        return {
          type: "performer",
          value: performer,
          label: `${performer.name}${formatDisambiguation(performer)}`,
          sublabel: [
            studioSceneCount > 0
              ? `${studioSceneCount} scene${studioSceneCount !== 1 ? "s" : ""} for studio`
              : null,
            performer.birth_date ? `Born: ${performer.birth_date}` : null,
            performer.aliases.length
              ? `AKA: ${performer.aliases.join(", ")}`
              : null,
          ]
            .filter((p) => p !== null)
            .join(", "),
          studioSceneCount,
        };
      });
  }

  // Split performers into studio performers and others when studioId is provided
  let performerGroups: SearchGroup[] = [];
  if (studioId && performers.length > 0) {
    const studioPerformers = performers.filter(
      (p) =>
        (p as SearchResult & { studioSceneCount: number }).studioSceneCount > 0,
    );
    const otherPerformers = performers.filter(
      (p) =>
        (p as SearchResult & { studioSceneCount: number }).studioSceneCount ===
        0,
    );

    if (studioPerformers.length > 0) {
      performerGroups.push({
        label: "Studio Performers",
        options: studioPerformers,
      });
    }
    if (otherPerformers.length > 0) {
      // Only label as "Other" if there are studio performers
      performerGroups.push({
        label: studioPerformers.length > 0 ? "Other Performers" : "Performers",
        options: otherPerformers,
      });
    }
  } else if (performers.length > 0) {
    performerGroups = [{ label: "Performers", options: performers }];
  }

  const sceneResults = scenes.length
    ? [{ label: "Scenes", options: scenes }]
    : [];
  const showAll =
    showAllLink && (performerGroups.length > 0 || sceneResults.length > 0)
      ? [{ type: "ALL", label: "Show all results" }]
      : [];

  return [...showAll, ...performerGroups, ...sceneResults];
}

const SearchField: FC<SearchFieldProps> = ({
  onClick,
  onClickPerformer,
  searchType = SearchType.Performer,
  excludeIDs = [],
  nav = false,
  placeholder,
  showAllLink = false,
  autoFocus = false,
  studioId,
}) => {
  const client = useApolloClient();
  const navigate = useNavigate();
  const [selectedValue, setSelected] = useState(null);
  const searchTerm = useRef("");
  const selectRef =
    useRef<SelectInstance<SearchResult, false, GroupBase<SearchResult>>>(null);

  const handleSearch = async (term: string) => {
    if (term) {
      const { data } = await client.query<
        SearchPerformersQuery | SearchAllQuery
      >({
        query:
          searchType === SearchType.Performer
            ? SearchPerformersGQL
            : SearchAllGQL,
        variables: {
          term,
          ...(searchType === SearchType.Performer && studioId
            ? { studioId, hasStudioId: true }
            : {}),
        },
        fetchPolicy: "network-only",
      });
      return handleResult(data, excludeIDs, showAllLink, studioId);
    }
    return [];
  };

  const debouncedLoadOptions = debounce(handleSearch, 400);

  const handleLoad = (term: string) => {
    searchTerm.current = term;
    return debouncedLoadOptions(term);
  };

  const handleChange = (result: OnChangeValue<SearchResult, false>) => {
    if (result?.type === "ALL")
      return navigate(createHref(ROUTE_SEARCH, { "*": searchTerm.current }));

    if (result?.value) {
      if (valueIsPerformer(result.value)) onClickPerformer?.(result.value);
      onClick?.(result.value);
      if (nav) navigate(`/${result.type}s/${result.value.id}`);
    }

    setSelected(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && searchTerm.current && showAllLink) {
      navigate(createHref(ROUTE_SEARCH, { "*": searchTerm.current }));
      selectRef?.current?.blur();
    }
  };

  return (
    <div className="SearchField">
      <Async
        autoFocus={autoFocus}
        classNamePrefix="react-select"
        value={selectedValue}
        loadOptions={handleLoad}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        ref={selectRef}
        placeholder={
          placeholder ??
          (searchType === SearchType.Performer
            ? "Search for performer..."
            : "Search for performer or scene...")
        }
        formatOptionLabel={formatOptionLabel}
        components={{
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
          ValueContainer,
        }}
        noOptionsMessage={({ inputValue }) =>
          inputValue === "" ? null : `No result found for "${inputValue}"`
        }
      />
    </div>
  );
};

export default SearchField;
