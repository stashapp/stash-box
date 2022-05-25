import { FC, useState } from "react";
import Async from "react-select/async";
import { OnChangeValue, MenuPlacement } from "react-select";
import { useApolloClient } from "@apollo/client";
import debounce from "p-debounce";

import SearchTagsQuery from "src/graphql/queries/SearchTags.gql";

import {
  SearchTags_searchTag as Tag,
  SearchTags,
  SearchTagsVariables,
} from "src/graphql/definitions/SearchTags";
import { TagLink } from "src/components/fragments";
import { tagHref } from "src/utils/route";

type TagSlim = {
  id: string;
  name: string;
  aliases: string[];
};

interface TagSelectProps {
  tags: TagSlim[];
  onChange: (tags: TagSlim[]) => void;
  message?: string;
  excludeTags?: string[];
  menuPlacement?: MenuPlacement;
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

const TagSelect: FC<TagSelectProps> = ({
  tags: initialTags,
  onChange,
  message = "Add tag:",
  excludeTags = [],
  menuPlacement = "auto",
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
    const { data } = await client.query<SearchTags, SearchTagsVariables>({
      query: SearchTagsQuery,
      variables: {
        term,
        limit: 25,
      },
    });

    return data.searchTag
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
          menuPlacement={menuPlacement}
          controlShouldRenderValue={false}
        />
      </div>
    </div>
  );
};

export default TagSelect;
