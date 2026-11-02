import { useReadQuery } from "@apollo/client/react";
import { createRoute, getRouteApi, Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import { TagDocument } from "src/graphql";
import { narrowRoute } from "src/routing/layouts";
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

const tagsRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "tags",
});

const tagsListRoute = createRoute({
  getParentRoute: () => tagsRoute,
  path: "/",
  component: TagListPage,
});

const tagsAddRoute = createRoute({
  getParentRoute: () => tagsRoute,
  path: "add",
  component: TagAddPage,
});

const tagsEntityRoute = createRoute({
  getParentRoute: () => tagsRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(TagDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(client.readQuery({ query: TagDocument, variables })?.findTag);
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton kind="detail" label="Loading tag" />,
  notFoundComponent: () => <ErrorMessage error="Tag not found." />,
  component: Outlet,
});

const tagsMergeRoute = createRoute({
  getParentRoute: () => tagsEntityRoute,
  path: "merge",
  component: TagMergePage,
});

const tagsDeleteRoute = createRoute({
  getParentRoute: () => tagsEntityRoute,
  path: "delete",
  component: TagDeletePage,
});

const tagsEditRoute = createRoute({
  getParentRoute: () => tagsEntityRoute,
  path: "edit",
  component: TagEditPage,
});

const tagsDetailRoute = createRoute({
  getParentRoute: () => tagsEntityRoute,
  path: "/",
  component: TagDetailPage,
});

export const tagRoutes = tagsRoute.addChildren([
  tagsListRoute,
  tagsAddRoute,
  tagsEntityRoute.addChildren([
    tagsMergeRoute,
    tagsDeleteRoute,
    tagsEditRoute,
    tagsDetailRoute,
  ]),
]);
