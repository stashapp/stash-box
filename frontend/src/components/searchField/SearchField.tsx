import React, { useRef, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import {
  components,
  OptionsType,
  OptionTypeBase,
  OptionProps,
  ValueType,
} from "react-select";
import Async from "react-select/async";
import { debounce } from "lodash";
import { useHistory } from "react-router-dom";
import { loader } from "graphql.macro";

import {
  SearchAll,
  SearchAll_searchScene as SceneAllResult,
  SearchAll_searchPerformer as PerformerAllResult,
} from "src/graphql/definitions/SearchAll";
import {
  SearchPerformers,
  SearchPerformers_searchPerformer as PerformerOnlyResult,
} from "src/graphql/definitions/SearchPerformers";
import { formatFuzzyDate, createHref } from "src/utils";
import { ROUTE_SEARCH } from "src/constants/route";

const SearchAllQuery = loader("src/graphql/queries/SearchAll.gql");
const SearchPerformersQuery = loader(
  "src/graphql/queries/SearchPerformers.gql"
);

export enum SearchType {
  Performer = "performer",
  Combined = "combined",
}

interface SearchFieldProps {
  onClick?: (result: SceneResult | PerformerResult) => void;
  onClickPerformer?: (result: PerformerResult) => void;
  searchType: SearchType;
  excludeIDs?: string[];
  navigate?: boolean;
  placeholder?: string;
  showAllLink?: boolean;
}

export type PerformerResult = PerformerAllResult | PerformerOnlyResult;
export type SceneResult = SceneAllResult;

interface SearchGroup {
  label: string;
  options: SearchResult[];
}
interface SearchResult extends OptionTypeBase {
  type: string;
  value?: SceneResult | PerformerResult;
  label?: string;
  subLabel?: string;
}

const Option = (props: OptionProps<SearchResult, false>) => {
  const {
    data: { label, subLabel },
  } = props;
  return (
    <components.Option {...props}>
      <div className="search-value">{label}</div>
      <div className="search-subvalue">{subLabel}</div>
    </components.Option>
  );
};

const resultIsSearchAll = (
  arg: SearchAll | SearchPerformers
): arg is SearchAll =>
  (arg as SearchAll).searchPerformer !== undefined &&
  (arg as SearchAll).searchScene !== undefined;

const valueIsPerformer = (
  arg?: SceneResult | PerformerResult
): arg is PerformerResult => arg?.__typename === "Performer";

function handleResult(
  result: SearchAll | SearchPerformers,
  callback: (result: (SearchGroup | SearchResult)[]) => void,
  excludeIDs: string[],
  showAllLink: boolean
) {
  let performers: SearchResult[] = [];
  let scenes: SearchResult[] = [];

  if (resultIsSearchAll(result)) {
    const performerResults = (result?.searchPerformer?.filter(
      (p) => p !== null
    ) ?? []) as PerformerAllResult[];
    performers = performerResults
      .filter((performer) => !excludeIDs.includes(performer.id))
      .map((performer) => ({
        type: "performer",
        value: performer,
        label: `${performer.name}${
          // eslint-disable-next-line prefer-template
          performer.disambiguation ? " (" + performer.disambiguation + ")" : ""
        }`,
        subLabel: [
          performer?.birthdate
            ? `Born: ${formatFuzzyDate(performer.birthdate)}`
            : null,
          performer?.aliases.length
            ? `AKA: ${performer.aliases.join(", ")}`
            : null,
        ]
          .filter((p) => p !== null)
          .join(", "),
      }));

    const sceneResults = (result?.searchScene?.filter((p) => p !== null) ??
      []) as SceneAllResult[];
    scenes = sceneResults
      .filter((scene) => !excludeIDs.includes(scene.id))
      .map((scene) => ({
        type: "scene",
        value: scene,
        label: `${scene.title} ${scene.date ? `(${scene.date})` : ""}`,
        subLabel: `${scene?.studio?.name ?? ""}${
          scene.performers && scene.studio ? " • " : ""
        }
          ${scene.performers.map((p) => p.as || p.performer.name).join(", ")}`,
      }));
  } else {
    const performerResults = (result?.searchPerformer?.filter(
      (p) => p !== null
    ) ?? []) as PerformerOnlyResult[];
    performers = performerResults
      .filter((performer) => !excludeIDs.includes(performer.id))
      .map((performer) => ({
        type: "performer",
        value: performer,
        label: `${performer.name} ${
          // eslint-disable-next-line prefer-template
          performer.disambiguation ? "(" + performer.disambiguation + ")" : ""
        }`,
        subLabel: [
          performer.birthdate
            ? `Born: ${formatFuzzyDate(performer.birthdate)}`
            : null,
          performer.aliases.length
            ? `AKA: ${performer.aliases.join(", ")}`
            : null,
        ]
          .filter((p) => p !== null)
          .join(", "),
      }));
  }

  callback([
    ...(showAllLink ? [{ type: "ALL", label: "Show all results" }] : []),
    ...(performers.length
      ? [{ label: "Performers", options: performers }]
      : []),
    ...(scenes.length ? [{ label: "Scenes", options: scenes }] : []),
  ]);
}

const SearchField: React.FC<SearchFieldProps> = ({
  onClick,
  onClickPerformer,
  searchType = SearchType.Performer,
  excludeIDs = [],
  navigate = false,
  placeholder,
  showAllLink = false,
}) => {
  const history = useHistory();
  const [selectedValue, setSelected] = useState(null);
  const [searchCallback, setCallback] = useState<
    (result: (SearchGroup | SearchResult)[]) => void
  >();
  const searchTerm = useRef("");
  const [search] = useLazyQuery(
    searchType === SearchType.Performer
      ? SearchPerformersQuery
      : SearchAllQuery,
    {
      fetchPolicy: "network-only",
      onCompleted: (result) => {
        if (searchCallback)
          handleResult(result, searchCallback, excludeIDs, showAllLink);
      },
    }
  );

  const handleSearch = (
    term: string,
    callback: (options: OptionsType<SearchResult>) => void
  ) => {
    if (term) {
      setCallback(() => callback);
      search({ variables: { term } });
    } else callback([]);
  };

  const debouncedLoadOptions = debounce(handleSearch, 400);

  const handleLoad = (
    term: string,
    callback: (options: OptionsType<SearchResult>) => void
  ) => {
    searchTerm.current = term;
    debouncedLoadOptions(term, callback);
  };

  const handleChange = (result: ValueType<SearchResult, false>) => {
    const option = Array.isArray(result) ? result[0] : result;
    if (option) {
      if (valueIsPerformer(option.value)) onClickPerformer?.(option.value);
      if (option.type === "ALL")
        return history.push(
          createHref(ROUTE_SEARCH, { term: searchTerm.current })
        );
      onClick?.(option.value);
      if (navigate) history.push(`/${option.type}s/${option.value.id}`);
    }

    setSelected(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && searchTerm.current) {
      history.push(createHref(ROUTE_SEARCH, { term: searchTerm.current }));
    }
  };

  return (
    <div className="SearchField">
      <Async
        classNamePrefix="react-select"
        autoload={false}
        value={selectedValue}
        defaultOptions
        loadOptions={handleLoad}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={
          placeholder ??
          (searchType === SearchType.Performer
            ? "Search for performer..."
            : "Search for performer or scene...")
        }
        components={{
          Option,
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        noOptionsMessage={({ inputValue }) =>
          inputValue === "" ? null : `No result found for "${inputValue}"`
        }
      />
    </div>
  );
};

export default SearchField;
