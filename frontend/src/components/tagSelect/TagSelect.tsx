import React, { useState } from "react";
import Async from "react-select/async";
import { ValueType, OptionTypeBase } from "react-select";
import { debounce } from "lodash";

import { Tags_queryTags_tags as Tag } from "src/graphql/definitions/Tags";

import { useLazyTags } from "src/graphql";
import { TagLink } from "src/components/fragments";
import { tagHref } from "src/utils/route";

interface TagSelectProps {
  tags: Tag[];
  onChange: (tags: Tag[]) => void;
  message?: string;
  excludeTags?: string[];
}

interface SearchResult extends OptionTypeBase {
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
  const [tags, setTags] = useState(initialTags);
  const [searchCallback, setCallback] = useState<
    (result: SearchResult[]) => void
  >();
  const [search] = useLazyTags({
    fetchPolicy: "network-only",
    onCompleted: (result) => {
      if (searchCallback) {
        searchCallback(
          result.queryTags.tags
            .filter((tag) => !excludeTags.includes(tag.id))
            .map((tag) => ({
              label: tag.name,
              value: tag,
              subLabel: tag.description ?? "",
            }))
        );
      }
    },
  });

  const handleChange = (result: ValueType<SearchResult>) => {
    const res = result as SearchResult;
    const newTags = [...tags, res.value];
    setTags(newTags);
    onChange(newTags);
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

  const handleSearch = (
    term: string,
    callback: (options: Array<SearchResult>) => void
  ) => {
    if (term) {
      setCallback(() => callback);
      search({ variables: { tagFilter: { name: term } } });
    } else callback([]);
  };

  const debouncedLoadOptions = debounce(handleSearch, 400);

  return (
    <div className={CLASSNAME}>
      <div className={CLASSNAME_LIST}>{tagList}</div>
      <div className={CLASSNAME_CONTAINER}>
        <span>{message}</span>
        <Async
          value={null}
          classNamePrefix="react-select"
          className={`react-select ${CLASSNAME_SELECT}`}
          onChange={handleChange}
          loadOptions={debouncedLoadOptions}
          noOptionsMessage={({ inputValue }) =>
            inputValue === "" ? null : `No tags found for "${inputValue}"`
          }
        />
      </div>
    </div>
  );
};

export default TagSelect;
