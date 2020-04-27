import React, { useState } from "react";
import { useLazyQuery } from "@apollo/react-hooks";
import { components, OptionsType, OptionProps } from "react-select";
import Async from "react-select/async";
import { debounce } from "lodash";
import { useHistory } from "react-router-dom";
import SearchAllQuery from "src/queries/SearchAll.gql";
import SearchPerformersQuery from "src/queries/SearchPerformers.gql";
import {
  SearchAll,
  SearchAll_searchScene as SceneResult,
  SearchAll_searchPerformer as PerformerResult,
} from "src/definitions/SearchAll";
import { SearchPerformers } from "src/definitions/SearchPerformers";
import GetFuzzyDate from "src/utils/date";

export const enum SearchType {
  Performer = "performer",
  Combined = "combined",
}

interface SearchFieldProps {
  onClick?: (result: PerformerResult | SceneResult) => void;
  searchType: SearchType;
}

interface SearchGroup {
  label: string;
  options: SearchResult[];
}
interface SearchResult {
  type: string;
  value: PerformerResult | SceneResult;
  label: string;
  subLabel: string;
}

const Option: React.FC = (props: OptionProps<OptionsType<SearchResult>>) => {
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

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const resultIsSearchAll = (arg: any): arg is SearchAll =>
  arg.searchPerformer && arg.searchScene;

function handleResult(
  result: SearchAll | SearchPerformers,
  callback: (result: SearchGroup[]) => void
) {
  const performers =
    result.searchPerformer &&
    result.searchPerformer.map((performer: PerformerResult) => ({
      type: "performer",
      value: performer,
      label: performer.name,
      subLabel: [
        performer.birthdate
          ? `Born: ${GetFuzzyDate(performer.birthdate)}`
          : null,
        performer.aliases.length
          ? `AKA: ${performer.aliases.join(", ")}`
          : null,
      ]
        .filter((p) => p !== null)
        .join(", "),
    }));
  const scenes = resultIsSearchAll(result)
    ? result.searchScene.map((scene: SceneResult) => ({
        type: "scene",
        value: scene,
        label: `${scene.title} ${scene.date ? `(${scene.date})` : ""}`,
        subLabel: `${scene.studio.name}${scene.performers ? " • " : ""}
            ${scene.performers
              .map((p) => p.as || p.performer.name)
              .join(", ")}`,
      }))
    : [];

  const options = [];
  if (performers.length)
    options.push({ label: "Performers", options: performers });
  if (scenes.length) options.push({ label: "Scenes", options: scenes });
  callback(options);
}

const SearchField: React.FC<SearchFieldProps> = ({
  onClick,
  searchType = SearchType.Performer,
}) => {
  const history = useHistory();
  const [selectedValue, setSelected] = useState(null);
  const [searchCallback, setCallback] = useState(null);
  const [search] = useLazyQuery(
    searchType === SearchType.Performer
      ? SearchPerformersQuery
      : SearchAllQuery,
    { onCompleted: (result) => handleResult(result, searchCallback) }
  );

  const handleSearch = (
    term: string,
    callback: (options: Array<SearchGroup>) => void
  ) => {
    setCallback(() => callback);
    search({ variables: { term } });
  };

  const debouncedLoadOptions = debounce(handleSearch, 400);

  const handleChange = (result: SearchResult) => {
    if (result)
      if (onClick) onClick(result.value);
      else history.push(`/${result.type}s/${result.value.id}`);

    setSelected(null);
  };

  return (
    <div className="SearchField ml-4">
      <Async
        classNamePrefix="react-select"
        autoload={false}
        value={selectedValue}
        defaultOptions
        loadOptions={debouncedLoadOptions}
        onChange={handleChange}
        placeholder={
          searchType === SearchType.Performer
            ? "Search for performer..."
            : "Search for performer or scene..."
        }
        components={{
          Option,
          DropdownIndicator: () => null,
          IndicatorSeparator: () => null,
        }}
        noOptionsMessage={({ inputValue }: { inputValue: string }): string =>
          null && inputValue
        }
      />
    </div>
  );
};

export default SearchField;
