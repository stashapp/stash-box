import { Outlet, useParams } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import type { TagQuery } from "src/graphql";
import { useTag } from "src/graphql";

import Tag from "./Tag";
import TagAdd from "./TagAdd";
import TagDelete from "./TagDelete";
import TagEdit from "./TagEdit";
import TagMerge from "./TagMerge";
import Tags from "./Tags";

const TagContext = createContext<NonNullable<TagQuery["findTag"]> | null>(null);
export const TagLayout = () => {
  const { id } = useParams({ strict: false });
  const { data, loading } = useTag({ id: id ?? "" }, !id);
  if (loading) return <PageSkeleton kind="detail" label="Loading tag" />;
  const tag = data?.findTag;
  if (!tag) return <ErrorMessage error="Tag not found." />;
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
