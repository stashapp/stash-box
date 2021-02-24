import React from "react";
import { Row } from "react-bootstrap";

import { useScenes, SortDirectionEnum, SceneFilterType } from "src/graphql";
import { usePagination } from "src/hooks";
import SceneCard from "src/components/sceneCard";
import { ErrorMessage } from "src/components/fragments";
import List from "./List";

const PER_PAGE = 20;

interface Props {
  perPage?: number;
  filter?: SceneFilterType;
}

const SceneList: React.FC<Props> = ({ perPage = PER_PAGE, filter = {} }) => {
  const { page, setPage } = usePagination();
  const { loading, data } = useScenes({
    filter: {
      page,
      per_page: perPage,
      sort: "DATE",
      direction: SortDirectionEnum.DESC,
    },
    sceneFilter: filter,
  });

  if (!loading && !data) return <ErrorMessage error="Failed to load scenes." />;

  const scenes = (data?.queryScenes.scenes ?? []).map((scene) => (
    <SceneCard key={scene.id} performance={scene} />
  ));

  return (
    <List
      page={page}
      setPage={setPage}
      perPage={perPage}
      listCount={data?.queryScenes.count}
      loading={loading}
      entityName="scenes"
    >
      <Row>{scenes}</Row>
    </List>
  );
};

export default SceneList;
