import type { FC } from "react";
import { Route, Routes, useParams } from "react-router-dom";

import { useTag } from "src/graphql";
import Title from "src/components/title";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";

import Tag from "./Tag";
import Tags from "./Tags";
import TagAdd from "./TagAdd";
import TagEdit from "./TagEdit";
import TagMerge from "./TagMerge";
import TagDelete from "./TagDelete";

const TagLoader: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useTag({ id });

  if (loading) return <LoadingIndicator message="Loading tag..." />;

  if (!id) return <ErrorMessage error="Tag ID is missing" />;

  const tag = data?.findTag;
  if (!tag) return <ErrorMessage error="Tag not found." />;

  return (
    <Routes>
      <Route
        path="/merge"
        element={
          <>
            <Title page={`Merge Tag "${tag.name}"`} />
            <TagMerge tag={tag} />
          </>
        }
      />
      <Route
        path="/delete"
        element={
          <>
            <Title page={`Delete Tag "${tag.name}"`} />
            <TagDelete tag={tag} />
          </>
        }
      />
      <Route
        path="/edit"
        element={
          <>
            <Title page={`Edit Tag "${tag.name}"`} />
            <TagEdit tag={tag} />
          </>
        }
      />
      <Route
        path="/"
        element={
          <>
            <Title page={`Tag "${tag.name}"`} />
            <Tag tag={tag} />
          </>
        }
      />
    </Routes>
  );
};

const TagRoutes: FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <>
          <Title page="Tags" />
          <Tags />
        </>
      }
    />
    <Route
      path="/add"
      element={
        <>
          <Title page="Add Tag" />
          <TagAdd />
        </>
      }
    />
    <Route path="/:id/*" element={<TagLoader />} />
  </Routes>
);

export default TagRoutes;
