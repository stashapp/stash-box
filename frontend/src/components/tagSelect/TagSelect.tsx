import React, { useState } from "react";
import { useQuery } from "@apollo/react-hooks";
import Select, { ValueType, OptionTypeBase } from "react-select";
import { loader } from "graphql.macro";

import {
  Tags,
  TagsVariables,
  Tags_queryTags_tags as Tag,
} from "src/definitions/Tags";
import { SortDirectionEnum } from "src/definitions/globalTypes";

import { CloseButton } from "src/components/fragments";

const TagsQuery = loader("src/queries/Tags.gql");

interface TagSelectProps {
  tags: Tag[];
  onChange: (tags: string[]) => void;
}

interface IOptionType extends OptionTypeBase {
  label: string;
  value: Tag;
}

const CLASSNAME = "TagSelect";
const CLASSNAME_LIST = `${CLASSNAME}-list`;
const CLASSNAME_SELECT = `${CLASSNAME}-select`;
const CLASSNAME_CONTAINER = `${CLASSNAME}-container`;

const TagSelect: React.FC<TagSelectProps> = ({
  tags: initialTags,
  onChange,
}) => {
  const [tags, setTags] = useState(initialTags);
  const { loading, data } = useQuery<Tags, TagsVariables>(TagsQuery, {
    variables: {
      filter: {
        per_page: 1000,
        sort: "NAME",
        direction: SortDirectionEnum.ASC,
      },
    },
  });

  if (loading) return <div />;

  const options: IOptionType[] = (data?.queryTags?.tags ?? []).map((tag) => ({
    label: tag.description ?? tag.name,
    value: tag,
  }));

  const addTag = (selected: ValueType<IOptionType>) => {
    const selectedTag = selected as IOptionType;
    const newTags = [...tags, selectedTag.value];
    setTags(newTags);
    onChange(newTags.map((tag) => tag.id));
  };

  const removeTag = (id: string) => {
    const newTags = tags.filter((tag) => tag.id !== id);
    setTags(newTags);
    onChange(newTags.map((tag) => tag.id));
  };

  const tagList = (tags ?? [])
    .sort((a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0))
    .map((tag) => (
      <span className="badge badge-pill badge-light" key={tag.id}>
        <span>{tag.name}</span>
        <CloseButton
          className="remove-item"
          handler={() => removeTag(tag.id)}
        />
      </span>
    ));

  return (
    <div className={CLASSNAME}>
      <div className={CLASSNAME_LIST}>{tagList}</div>
      <div className={CLASSNAME_CONTAINER}>
        <span>Add tag:</span>
        <Select
          value={null}
          classNamePrefix="react-select"
          className={`react-select ${CLASSNAME_SELECT}`}
          options={options}
          onChange={addTag}
        />
      </div>
    </div>
  );
};

export default TagSelect;
