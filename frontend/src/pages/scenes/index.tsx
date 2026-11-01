import { type QueryRef, useReadQuery } from "@apollo/client/react";
import { Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";
import { SceneListView } from "src/components/list/SceneList";
import Title from "src/components/title";
import type {
  SceneCountQuery,
  SceneQuery,
  SceneQueryInput,
  ScenesQuery,
} from "src/graphql";
import { usePagination } from "src/hooks";
import { requireEntity } from "src/routing/requireEntity";
import { SceneFingerprintClustersPage } from "./fingerprintClusters/SceneFingerprintClustersPage";
import Scene from "./Scene";
import SceneAdd from "./SceneAdd";
import SceneDelete from "./SceneDelete";
import SceneEdit from "./SceneEdit";

const SceneContext = createContext<NonNullable<SceneQuery["findScene"]> | null>(
  null,
);
export const SceneLayout = ({
  queryRef,
}: {
  queryRef: QueryRef<SceneQuery>;
}) => {
  const { data } = useReadQuery(queryRef);
  const scene = requireEntity(data.findScene);
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

export function SceneListPage({
  queryRef,
  total,
  input,
  updating,
}: {
  queryRef: QueryRef<ScenesQuery>;
  total: number | QueryRef<SceneCountQuery>;
  input: SceneQueryInput;
  updating: boolean;
}) {
  const { data } = useReadQuery(queryRef);
  const { setPage } = usePagination();
  const props = {
    scenes: data.queryScenes.scenes,
    page: input.page ?? 1,
    setPage,
    perPage: input.per_page ?? 20,
    updating,
  };
  return typeof total === "number" ? (
    <SceneListView {...props} count={total} />
  ) : (
    <CountedSceneList {...props} countRef={total} />
  );
}

function CountedSceneList({
  countRef,
  ...props
}: Omit<React.ComponentProps<typeof SceneListView>, "count"> & {
  countRef: QueryRef<SceneCountQuery>;
}) {
  const { data } = useReadQuery(countRef);
  return <SceneListView {...props} count={data.queryScenes.count} />;
}

export default SceneLayout;
