import { useReadQuery } from "@apollo/client/react";
import { createRoute, getRouteApi, Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import { SceneDocument } from "src/graphql";
import { narrowRoute } from "src/routing/layouts";
import { requireEntity } from "src/routing/requireEntity";
import {
  validateEntitySearch,
  validateSceneSearch,
} from "src/routing/searchValidators";
import { SceneFingerprintClustersPage } from "./fingerprintClusters/SceneFingerprintClustersPage";
import Scene from "./Scene";
import SceneAdd from "./SceneAdd";
import SceneDelete from "./SceneDelete";
import SceneEdit from "./SceneEdit";
import Scenes from "./Scenes";

const routeApi = getRouteApi("/narrow/scenes/$id");

export const SceneDeletePage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const scene = requireEntity(data.findScene);

  return (
    <>
      <Title page={`Delete Scene "${scene.title}"`} />
      <SceneDelete scene={scene} />
    </>
  );
};

export const SceneEditPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const scene = requireEntity(data.findScene);

  return (
    <>
      <Title page={`Edit Scene "${scene.title}"`} />
      <SceneEdit scene={scene} />
    </>
  );
};

export const SceneFingerprintsPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const scene = requireEntity(data.findScene);

  return (
    <>
      <Title page={`Fingerprint Clusters "${scene.title}"`} />
      <SceneFingerprintClustersPage scene={scene} />
    </>
  );
};

export const SceneDetailPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const scene = requireEntity(data.findScene);

  return (
    <>
      <Title page={`"${scene.title}"`} />
      <Scene scene={scene} />
    </>
  );
};

export const SceneAddPage: FC = () => (
  <>
    <Title page="Add Scene" />
    <SceneAdd />
  </>
);

export const SceneListPage = () => <Scenes />;

export default SceneDetailPage;

const scenesRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "scenes",
});

const scenesAddRoute = createRoute({
  getParentRoute: () => scenesRoute,
  path: "add",
  component: SceneAddPage,
});

const scenesListRoute = createRoute({
  getParentRoute: () => scenesRoute,
  path: "/",
  validateSearch: validateSceneSearch,
  component: SceneListPage,
});

const scenesEntityRoute = createRoute({
  getParentRoute: () => scenesRoute,
  path: "$id",
  validateSearch: validateEntitySearch,
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(SceneDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: SceneDocument, variables })?.findScene,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton kind="scene" label="Loading scene" />,
  notFoundComponent: () => <ErrorMessage error="Scene not found." />,
  component: Outlet,
});

const scenesDeleteRoute = createRoute({
  getParentRoute: () => scenesEntityRoute,
  path: "delete",
  component: SceneDeletePage,
});

const scenesEditRoute = createRoute({
  getParentRoute: () => scenesEntityRoute,
  path: "edit",
  component: SceneEditPage,
});

const scenesFingerprintsRoute = createRoute({
  getParentRoute: () => scenesEntityRoute,
  path: "fingerprints",
  component: SceneFingerprintsPage,
});

const scenesDetailRoute = createRoute({
  getParentRoute: () => scenesEntityRoute,
  path: "/",
  component: SceneDetailPage,
});

export const sceneRoutes = scenesRoute.addChildren([
  scenesAddRoute,
  scenesListRoute,
  scenesEntityRoute.addChildren([
    scenesDeleteRoute,
    scenesEditRoute,
    scenesFingerprintsRoute,
    scenesDetailRoute,
  ]),
]);
