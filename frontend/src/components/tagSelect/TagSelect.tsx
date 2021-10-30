import React, { useState } from "react";
import Async from "react-select/async";
import { OnChangeValue } from "react-select";
import { useApolloClient } from "@apollo/client";
import debounce from "p-debounce";

import TagsQuery from "src/graphql/queries/Tags.gql";

import {
  Tags_queryTags_tags as Tag,
  Tags,
  TagsVariables,
} from "src/graphql/definitions/Tags";
import { SortDirectionEnum } from "src/graphql";
import { TagLink } from "src/components/fragments";
import { tagHref } from "src/utils/route";

interface TagSelectProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  message?: string;
  excludeTags?: string[];
}

interface SearchResult {
  value: Tag;
  label: string;
  subLabel: string;
}

const CLASSNAME = "TagSelect";
const CLASSNAME_LIST = `${CLASSNAME}-list`;
const CLASSNAME_SELECT = `${CLASSNAME}-select`;
const CLASSNAME_CONTAINER = `${CLASSNAME}-container`;

const TagSelect: React.FC<TagSelectProps> = ({
  tags: initialTags,
  onChange,
  message = "Add tag:",
  excludeTags = [],
}) => {
  const client = useApolloClient();
  const [tags, setTags] = useState(initialTags);
  const excluded = [...excludeTags, ...tags.map((t) => t.id)];

  const handleChange = (result: OnChangeValue<SearchResult, false>) => {
    if (result?.value) {
      const newTags = [...tags, result.value];
      setTags(newTags);
      onChange(newTags);
    }
  };

  const removeTag = (id: string) => {
    const newTags = tags.filter((tag) => tag.id !== id);
    setTags(newTags);
    onChange(newTags);
  };

  const tagList = [...(tags ?? [])]
    .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
    .map((tag) => (
      <TagLink
        title={tag.name}
        link={tagHref(tag)}
        onRemove={() => removeTag(tag.id)}
        key={tag.id}
        disabled
      />
    ));

  const handleSearch = async (term: string) => {
    const { data } = await client.query<Tags, TagsVariables>({
      query: TagsQuery,
      variables: {
        tagFilter: { name: term },
        filter: { direction: SortDirectionEnum.ASC },
      },
    });

    return data.queryTags.tags
      .filter((tag) => !excluded.includes(tag.id))
      .map((tag) => ({
        label: tag.name,
        value: tag,
        subLabel: tag.description ?? "",
      }));
  };

  const debouncedLoadOptions = debounce(handleSearch, 400);

  return (
    <div className={CLASSNAME}>
      <div className={CLASSNAME_LIST}>{tagList}</div>
      <div className={CLASSNAME_CONTAINER}>
        <span>{message}</span>
        <Async
          classNamePrefix="react-select"
          className={`react-select ${CLASSNAME_SELECT}`}
          onChange={handleChange}
          loadOptions={debouncedLoadOptions}
          placeholder="Search for tag"
          noOptionsMessage={({ inputValue }) =>
            inputValue === "" ? null : `No tags found for "${inputValue}"`
          }
        />
      </div>
    </div>
  );
};

export default TagSelect;
