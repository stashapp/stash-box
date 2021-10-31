import React from "react";
import { Route, Switch, useParams } from "react-router-dom";

import { useTag } from "src/graphql";
import Title from "src/components/title";
import {
  ROUTE_TAG,
  ROUTE_TAGS,
  ROUTE_TAG_ADD,
  ROUTE_TAG_MERGE,
  ROUTE_TAG_EDIT,
  ROUTE_TAG_DELETE,
} from "src/constants/route";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";

import Tag from "./Tag";
import Tags from "./Tags";
import TagAdd from "./TagAdd";
import TagEdit from "./TagEdit";
import TagMerge from "./TagMerge";
import TagDelete from "./TagDelete";

const TagLoader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useTag({ id });

  if (loading) return <LoadingIndicator message="Loading tag..." />;

  if (!id) return <ErrorMessage error="Tag ID is missing" />;

  const tag = data?.findTag;
  if (!tag) return <ErrorMessage error="Tag not found." />;

  return (
    <Switch>
      <Route exact path={ROUTE_TAG_MERGE}>
        <>
          <Title page={`Merge Tag "${tag.name}"`} />
          <TagMerge tag={tag} />
        </>
      </Route>
      <Route exact path={ROUTE_TAG_DELETE}>
        <>
          <Title page={`Delete Tag "${tag.name}"`} />
          <TagDelete tag={tag} />
        </>
      </Route>
      <Route exact path={ROUTE_TAG_EDIT}>
        <>
          <Title page={`Edit Tag "${tag.name}"`} />
          <TagEdit tag={tag} />
        </>
      </Route>
      <Route exact path={ROUTE_TAG}>
        <>
          <Title page={`Tag "${tag.name}"`} />
          <Tag tag={tag} />
        </>
      </Route>
    </Switch>
  );
};

const TagRoutes: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_TAGS}>
      <>
        <Title page="Tags" />
        <Tags />
      </>
    </Route>
    <Route exact path={ROUTE_TAG_ADD}>
      <>
        <Title page="Add Tag" />
        <TagAdd />
      </>
    </Route>
    <Route path={ROUTE_TAG}>
      <TagLoader />
    </Route>
  </Switch>
);

export default TagRoutes;
