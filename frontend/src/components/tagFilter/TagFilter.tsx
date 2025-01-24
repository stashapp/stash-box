import { FC } from "react";
import Async from "react-select/async";
import { OnChangeValue, MenuPlacement } from "react-select";
import { useApolloClient } from "@apollo/client";
import debounce from "p-debounce";

import SearchTagsGQL from "src/graphql/queries/SearchTags.gql";

import { SearchTagsQuery, SearchTagsQueryVariables, useTag } from "src/graphql";

type Tag = NonNullable<SearchTagsQuery["query"][number]>;

interface TagFilterProps {
  tag: string;
  onChange: (tag: Tag | undefined) => void;
  excludeTags?: string[];
  menuPlacement?: MenuPlacement;
  allowDeleted?: boolean;
}

interface SearchResult {
  value: Tag;
  label: string;
  sublabel: string;
}

const CLASSNAME = "TagFilter";
const CLASSNAME_SELECT = `${CLASSNAME}-select`;

const TagFilter: FC<TagFilterProps> = ({
  tag: tagId,
  onChange,
  excludeTags = [],
  menuPlacement = "auto",
  allowDeleted = false,
}) => {
  const client = useApolloClient();
  const { data: tagData } = useTag({ id: tagId }, !tagId);
  const selectedTag = tagData?.findTag;

  const handleChange = (result: OnChangeValue<SearchResult, false>) => {
    onChange(result?.value);
  };

  const handleSearch = async (term: string) => {
    const { data } = await client.query<
      SearchTagsQuery,
      SearchTagsQueryVariables
    >({
      query: SearchTagsGQL,
      variables: {
        term,
        limit: 25,
      },
    });

    const { exact, query } = data;

    const exactResult =
      exact &&
      (allowDeleted || !exact.deleted) &&
      !excludeTags.includes(exact.id)
        ? {
            label: exact.name,
            value: exact,
            sublabel: exact.description ?? "",
          }
        : undefined;

    const queryResult = query
      .filter(
        (tag) =>
          !excludeTags.includes(tag.id) &&
          (allowDeleted || !tag.deleted) &&
          tag.id !== exact?.id,
      )
      .map((tag) => ({
        label: tag.name,
        value: tag,
        sublabel: tag.description ?? "",
      }));

    return [
      ...(exactResult
        ? [
            {
              label:
                exactResult.label.toLowerCase() === term.toLowerCase()
                  ? "Exact Match"
                  : "Alias Match",
              options: [exactResult],
            },
          ]
        : []),
      ...(queryResult ? [{ label: "Tags", options: queryResult }] : []),
    ];
  };

  const debouncedLoadOptions = debounce(handleSearch, 400);

  const formatOptionLabel = ({ label, sublabel, value }: SearchResult) => {
    return (
      <div title={value.aliases.map((a) => `\u{2022} ${a}`).join("\n")}>
        <div className={`${CLASSNAME_SELECT}-value`}>
          {value.deleted ? <del>{label}</del> : label}
        </div>
        <div className={`${CLASSNAME_SELECT}-subvalue`}>{sublabel}</div>
      </div>
    );
  };

  return (
    <Async
      classNamePrefix="react-select"
      className={`react-select ${CLASSNAME_SELECT}`}
      onChange={handleChange}
      loadOptions={debouncedLoadOptions}
      placeholder="Filter by tag"
      noOptionsMessage={({ inputValue }) =>
        inputValue === "" ? null : `No tags found for "${inputValue}"`
      }
      value={
        selectedTag && {
          label: selectedTag.name,
          value: selectedTag,
          sublabel: "",
        }
      }
      isClearable
      menuPlacement={menuPlacement}
      formatOptionLabel={formatOptionLabel}
    />
  );
};

export default TagFilter;
