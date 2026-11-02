import { Outlet, useParams } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import type { SceneQuery } from "src/graphql";
import { useScene } from "src/graphql";
import { SceneFingerprintClustersPage } from "./fingerprintClusters/SceneFingerprintClustersPage";
import Scene from "./Scene";
import SceneAdd from "./SceneAdd";
import SceneDelete from "./SceneDelete";
import SceneEdit from "./SceneEdit";
import Scenes from "./Scenes";

const SceneContext = createContext<NonNullable<SceneQuery["findScene"]> | null>(
  null,
);
export const SceneLayout = () => {
  const { id } = useParams({ strict: false });
  const { data, loading } = useScene({ id: id ?? "" }, !id);
  if (loading) return <PageSkeleton kind="scene" label="Loading scene" />;
  const scene = data?.findScene;
  if (!scene) return <ErrorMessage error="Scene not found." />;
  return (
    <SceneContext.Provider value={scene}>
      <Outlet />
    </SceneContext.Provider>
  );
};

export const SceneDeletePage: FC = () => {
  const value = useContext(SceneContext);
  if (!value) throw new Error("Scene layout is missing");
  const scene = value;
  return (
    <>
      <Title page={`Delete Scene "${scene.title}"`} />
      <SceneDelete scene={scene} />
    </>
  );
};

export const SceneEditPage: FC = () => {
  const value = useContext(SceneContext);
  if (!value) throw new Error("Scene layout is missing");
  const scene = value;
  return (
    <>
      <Title page={`Edit Scene "${scene.title}"`} />
      <SceneEdit scene={scene} />
    </>
  );
};

export const SceneFingerprintsPage: FC = () => {
  const value = useContext(SceneContext);
  if (!value) throw new Error("Scene layout is missing");
  const scene = value;
  return (
    <>
      <Title page={`Fingerprint Clusters "${scene.title}"`} />
      <SceneFingerprintClustersPage scene={scene} />
    </>
  );
};

export const SceneDetailPage: FC = () => {
  const value = useContext(SceneContext);
  if (!value) throw new Error("Scene layout is missing");
  const scene = value;
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

export default SceneLayout;
