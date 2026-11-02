import { Col, Row } from "react-bootstrap";
import SceneCard from "src/components/sceneCard";
import { useSceneCount, useScenes } from "src/graphql";
import { usePagination } from "src/hooks";
import { useFilterSearch } from "src/hooks/useUpdateSearch";
import { type SceneListOptions, sceneListInput } from "src/utils/listFilters";
import List from "./List";
import { QueryError } from "./QueryError";
import { SceneListFilters } from "./SceneListFilters";

export default function SceneList(options: SceneListOptions) {
  const params = useFilterSearch();
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
      <List
        entityName="scenes"
        page={page}
        setPage={setPage}
        perPage={options.perPage}
        listCount={derivedCount ?? count.data?.queryScenes.count}
        filters={
          <SceneListFilters
            favoriteFilter={options.favoriteFilter}
            tagsFilter={options.tagsFilter}
          />
        }
        loading={!visible && !error}
        updating={loading && !!visible}
      >
        <Row>
          {scenes.map((scene) => (
            <Col xs={3} key={scene.id}>
              <SceneCard scene={scene} />
            </Col>
          ))}
        </Row>
      </List>
    </>
  );
}
