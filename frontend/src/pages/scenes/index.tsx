import { useReadQuery } from "@apollo/client/react";
import { getRouteApi } from "@tanstack/react-router";
import type { FC } from "react";
import Title from "src/components/title";
import { requireEntity } from "src/routing/requireEntity";
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
