import React, { useContext } from "react";
import { useQuery } from "@apollo/client";
import { loader } from "graphql.macro";
import { Scenes } from "src/definitions/Scenes";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import SceneCard from "src/components/sceneCard";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { canEdit } from "src/utils/auth";
import AuthContext from "src/AuthContext";

const ScenesQuery = loader("src/queries/Scenes.gql");

const PER_PAGE = 20;

const ScenesComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const { page, setPage } = usePagination();
  const { loading: loadingData, data } = useQuery<Scenes>(ScenesQuery, {
    variables: {
      filter: { page, per_page: PER_PAGE, sort: "DATE", direction: "DESC" },
    },
  });

  if (loadingData) return <LoadingIndicator message="Loading scenes..." />;
  if (!data) return <ErrorMessage error="Failed to load scenes." />;

  const scenes = data.queryScenes.scenes.map((scene) => (
    <SceneCard key={scene.id} performance={scene} />
  ));

  return (
    <>
      <div className="d-flex">
        <h3 className="mr-4">Scenes</h3>
        {canEdit(auth.user) && (
          <Link to="/performers/add">
            <Button className="mr-auto">Create</Button>
          </Link>
        )}
        <Pagination
          onClick={setPage}
          count={data.queryScenes.count}
          perPage={PER_PAGE}
          active={page}
          showCount
        />
      </div>
      <div className="performers row">{scenes}</div>
      <div className="row">
        <Pagination
          onClick={setPage}
          count={data.queryScenes.count}
          perPage={PER_PAGE}
          active={page}
        />
      </div>
    </>
  );
};

export default ScenesComponent;
