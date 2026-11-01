import type { ReactNode } from "react";
import { Col, Row } from "react-bootstrap";
import SceneCard from "src/components/sceneCard";
import { type ScenesQuery, useSceneCount, useScenes } from "src/graphql";
import { usePagination, useQueryParams } from "src/hooks";
import { type SceneListOptions, sceneListInput } from "src/utils/listFilters";
import List from "./List";
import { QueryError } from "./QueryError";
import { SceneListFilters } from "./SceneListFilters";

export function SceneListView({
  scenes,
  count,
  page,
  setPage,
  perPage = 20,
  filters,
  loading = false,
  updating = false,
}: {
  scenes: ScenesQuery["queryScenes"]["scenes"];
  count?: number;
  page: number;
  setPage: (page: number) => void;
  perPage?: number;
  filters?: ReactNode;
  loading?: boolean;
  updating?: boolean;
}) {
  return (
    <List
      page={page}
      setPage={setPage}
      perPage={perPage}
      filters={filters}
      entityName="scenes"
      listCount={count}
      loading={loading}
      updating={updating}
    >
      <Row>
        {scenes.map((scene) => (
          <Col xs={3} key={scene.id}>
            <SceneCard scene={scene} />
          </Col>
        ))}
      </Row>
    </List>
  );
}

export default function SceneList(options: SceneListOptions) {
  const [params] = useQueryParams({
    sort: { name: "sort", type: "string" },
    dir: { name: "dir", type: "string" },
    favorite: { name: "favorite", type: "string" },
    tag: { name: "tag", type: "string" },
  });
  const { page: requestedPage, setPage } = usePagination();
  const input = sceneListInput({ ...params, page: requestedPage }, options);
  const page = input.page ?? 1;
  const { data, previousData, loading, error, refetch } = useScenes({ input });
  const visible = data ?? previousData;
  const scenes = visible?.queryScenes.scenes ?? [];
  const derivedCount =
    !loading && scenes.length > 0 && scenes.length < (options.perPage ?? 20)
      ? (page - 1) * (options.perPage ?? 20) + scenes.length
      : undefined;
  const count = useSceneCount(
    { input: { ...input, page: 1 } },
    !visible || derivedCount !== undefined || loading,
  );
  const retry = () => (error ? refetch() : count.refetch());
  return (
    <>
      <QueryError
        error={error ?? count.error}
        retry={retry}
        retrying={error ? loading : count.loading}
        showingPrevious={!!error && !!visible}
      />
      <SceneListView
        scenes={scenes}
        count={derivedCount ?? count.data?.queryScenes.count}
        page={page}
        setPage={setPage}
        perPage={options.perPage}
        filters={
          <SceneListFilters
            favoriteFilter={options.favoriteFilter}
            tagsFilter={options.tagsFilter}
          />
        }
        loading={!visible && !error}
        updating={loading && !!visible}
      />
    </>
  );
}
