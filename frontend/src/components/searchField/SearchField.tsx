import { type FC, type KeyboardEvent, useRef, useState } from "react";
import { useApolloClient } from "@apollo/client/react";
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
import { getImage } from "src/utils";
import {
  GenderIcon,
  SearchHint,
  SearchInput,
  Thumbnail,
} from "src/components/fragments";
import {
  handleResult,
  type SearchResult,
  type PerformerResult,
  type SceneResult,
} from "./handleResult";

export type { PerformerResult, SceneResult };

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

const ValueContainer: typeof components.ValueContainer = (props) => (
  <>
    <SearchHint />
    <components.ValueContainer {...props} />
  </>
);

const DropdownIndicator = () => null;
const IndicatorSeparator = () => null;

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
      if (!data) return [];
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
      return navigate(`/search?q=${encodeURIComponent(searchTerm.current)}`);

    if (result?.value) {
      if (valueIsPerformer(result.value)) onClickPerformer?.(result.value);
      onClick?.(result.value);
      if (nav) navigate(`/${result.type}s/${result.value.id}`);
    }

    setSelected(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && searchTerm.current && showAllLink) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.current)}`);
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
          DropdownIndicator,
          IndicatorSeparator,
          ValueContainer,
          Input: SearchInput,
        }}
        noOptionsMessage={({ inputValue }) =>
          inputValue === "" ? null : `No result found for "${inputValue}"`
        }
      />
    </div>
  );
};

export default SearchField;
