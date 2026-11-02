import { useReadQuery } from "@apollo/client/react";
import { createRoute, getRouteApi, Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import { FullPerformerDocument } from "src/graphql";
import { narrowRoute } from "src/routing/layouts";
import { requireEntity } from "src/routing/requireEntity";

import Performer from "./Performer";
import PerformerAdd from "./PerformerAdd";
import PerformerDelete from "./PerformerDelete";
import PerformerEdit from "./PerformerEdit";
import PerformerMerge from "./PerformerMerge";
import Performers from "./Performers";

const routeApi = getRouteApi("/narrow/performers/$id");

export const PerformerMergePage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const performer = requireEntity(data.findPerformer);

  return (
    <>
      <Title page={`Merge Into "${performer.name}"`} />
      <PerformerMerge performer={performer} />
    </>
  );
};

export const PerformerDeletePage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const performer = requireEntity(data.findPerformer);

  return (
    <>
      <Title page={`Delete "${performer.name}"`} />
      <PerformerDelete performer={performer} />
    </>
  );
};

export const PerformerEditPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const performer = requireEntity(data.findPerformer);

  return (
    <>
      <Title page={`Edit "${performer.name}"`} />
      <PerformerEdit performer={performer} />
    </>
  );
};

export const PerformerDetailPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const performer = requireEntity(data.findPerformer);

  return (
    <>
      <Title page={performer.name} />
      <Performer performer={performer} />
    </>
  );
};

export const PerformerListPage: FC = () => (
  <>
    <Title page="Performers" />
    <Performers />
  </>
);

export const PerformerAddPage: FC = () => (
  <>
    <Title page="Add Performer" />
    <PerformerAdd />
  </>
);

export default PerformerDetailPage;

const performersRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "performers",
});

const performersListRoute = createRoute({
  getParentRoute: () => performersRoute,
  path: "/",
  component: PerformerListPage,
});

const performersAddRoute = createRoute({
  getParentRoute: () => performersRoute,
  path: "add",
  component: PerformerAddPage,
});

const performersEntityRoute = createRoute({
  getParentRoute: () => performersRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(FullPerformerDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: FullPerformerDocument, variables })
        ?.findPerformer,
    );
    return { queryRef };
  },
  pendingComponent: () => (
    <PageSkeleton kind="performer" label="Loading performer" />
  ),
  notFoundComponent: () => <ErrorMessage error="Performer not found." />,
  component: Outlet,
});

const performersMergeRoute = createRoute({
  getParentRoute: () => performersEntityRoute,
  path: "merge",
  component: PerformerMergePage,
});

const performersDeleteRoute = createRoute({
  getParentRoute: () => performersEntityRoute,
  path: "delete",
  component: PerformerDeletePage,
});

const performersEditRoute = createRoute({
  getParentRoute: () => performersEntityRoute,
  path: "edit",
  component: PerformerEditPage,
});

const performersDetailRoute = createRoute({
  getParentRoute: () => performersEntityRoute,
  path: "/",
  component: PerformerDetailPage,
});

export const performerRoutes = performersRoute.addChildren([
  performersListRoute,
  performersAddRoute,
  performersEntityRoute.addChildren([
    performersMergeRoute,
    performersDeleteRoute,
    performersEditRoute,
    performersDetailRoute,
  ]),
]);
