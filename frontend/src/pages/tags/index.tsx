import { type QueryRef, useReadQuery } from "@apollo/client/react";
import { Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";
import Title from "src/components/title";
import type { TagQuery } from "src/graphql";
import { requireEntity } from "src/routing/requireEntity";

import Tag from "./Tag";
import TagAdd from "./TagAdd";
import TagDelete from "./TagDelete";
import TagEdit from "./TagEdit";
import TagMerge from "./TagMerge";
import Tags from "./Tags";

const TagContext = createContext<NonNullable<TagQuery["findTag"]> | null>(null);
export const TagLayout = ({ queryRef }: { queryRef: QueryRef<TagQuery> }) => {
  const { data } = useReadQuery(queryRef);
  const tag = requireEntity(data.findTag);
  return (
    <TagContext.Provider value={tag}>
      <Outlet />
    </TagContext.Provider>
  );
};

export const TagMergePage: FC = () => {
  const value = useContext(TagContext);
  if (!value) throw new Error("Tag layout is missing");
  const tag = value;
  return (
    <>
      <Title page={`Merge Tag "${tag.name}"`} />
      <TagMerge tag={tag} />
    </>
  );
};

export const TagDeletePage: FC = () => {
  const value = useContext(TagContext);
  if (!value) throw new Error("Tag layout is missing");
  const tag = value;
  return (
    <>
      <Title page={`Delete Tag "${tag.name}"`} />
      <TagDelete tag={tag} />
    </>
  );
};

export const TagEditPage: FC = () => {
  const value = useContext(TagContext);
  if (!value) throw new Error("Tag layout is missing");
  const tag = value;
  return (
    <>
      <Title page={`Edit Tag "${tag.name}"`} />
      <TagEdit tag={tag} />
    </>
  );
};

export const TagDetailPage: FC = () => {
  const value = useContext(TagContext);
  if (!value) throw new Error("Tag layout is missing");
  const tag = value;
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

export default TagLayout;
