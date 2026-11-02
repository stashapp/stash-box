import { useReadQuery } from "@apollo/client/react";
import { getRouteApi } from "@tanstack/react-router";
import type { FC } from "react";
import Title from "src/components/title";
import { requireEntity } from "src/routing/requireEntity";

import Tag from "./Tag";
import TagAdd from "./TagAdd";
import TagDelete from "./TagDelete";
import TagEdit from "./TagEdit";
import TagMerge from "./TagMerge";
import Tags from "./Tags";

const routeApi = getRouteApi("/narrow/tags/$id");

export const TagMergePage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const tag = requireEntity(data.findTag);

  return (
    <>
      <Title page={`Merge Tag "${tag.name}"`} />
      <TagMerge tag={tag} />
    </>
  );
};

export const TagDeletePage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const tag = requireEntity(data.findTag);

  return (
    <>
      <Title page={`Delete Tag "${tag.name}"`} />
      <TagDelete tag={tag} />
    </>
  );
};

export const TagEditPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const tag = requireEntity(data.findTag);

  return (
    <>
      <Title page={`Edit Tag "${tag.name}"`} />
      <TagEdit tag={tag} />
    </>
  );
};

export const TagDetailPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
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
