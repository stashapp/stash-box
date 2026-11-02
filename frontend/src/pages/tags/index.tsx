import { type QueryRef, useReadQuery } from "@apollo/client/react";
import type { FC } from "react";
import Title from "src/components/title";
import type { TagQuery } from "src/graphql";
import { requireEntity } from "src/routing/requireEntity";

import Tag from "./Tag";
import TagAdd from "./TagAdd";
import TagDelete from "./TagDelete";
import TagEdit from "./TagEdit";
import TagMerge from "./TagMerge";
import Tags from "./Tags";

interface TagPageProps {
  queryRef: QueryRef<TagQuery>;
}

export const TagMergePage: FC<TagPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const tag = requireEntity(data.findTag);

  return (
    <>
      <Title page={`Merge Tag "${tag.name}"`} />
      <TagMerge tag={tag} />
    </>
  );
};

export const TagDeletePage: FC<TagPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const tag = requireEntity(data.findTag);

  return (
    <>
      <Title page={`Delete Tag "${tag.name}"`} />
      <TagDelete tag={tag} />
    </>
  );
};

export const TagEditPage: FC<TagPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const tag = requireEntity(data.findTag);

  return (
    <>
      <Title page={`Edit Tag "${tag.name}"`} />
      <TagEdit tag={tag} />
    </>
  );
};

export const TagDetailPage: FC<TagPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const tag = requireEntity(data.findTag);

  return (
    <>
      <Title page={`Tag "${tag.name}"`} />
      <Tag tag={tag} />
    </>
  );
};

export const TagListPage: FC = () => (
  <>
    <Title page="Tags" />
    <Tags />
  </>
);

export const TagAddPage: FC = () => (
  <>
    <Title page="Add Tag" />
    <TagAdd />
  </>
);

export default TagDetailPage;
