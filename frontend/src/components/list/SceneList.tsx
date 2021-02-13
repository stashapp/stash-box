import React from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";
import { Row } from "react-bootstrap";

import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import {
  SortDirectionEnum,
  SceneFilterType,
} from "src/definitions/globalTypes";
import { usePagination } from "src/hooks";
import SceneCard from "src/components/sceneCard";
import { ErrorMessage } from "src/components/fragments";
import List from "./List";

const ScenesQuery = loader("src/queries/Scenes.gql");

const PER_PAGE = 20;

interface Props {
  perPage?: number;
  filter?: SceneFilterType;
}

const SceneList: React.FC<Props> = ({ perPage = PER_PAGE, filter = {} }) => {
  const { page, setPage } = usePagination();
  const { loading, data } = useQuery<Scenes, ScenesVariables>(ScenesQuery, {
    variables: {
      filter: {
        page,
        per_page: perPage,
        sort: "DATE",
        direction: SortDirectionEnum.DESC,
      },
      sceneFilter: filter,
    },
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
