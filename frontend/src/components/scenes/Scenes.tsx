import React, { useContext, useEffect, useState } from "react";
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
  const [count, setCount] = useState(0);
  const { page, setPage } = usePagination();
  const { loading, data } = useQuery<Scenes>(ScenesQuery, {
    variables: {
      filter: { page, per_page: PER_PAGE, sort: "DATE", direction: "DESC" },
    },
  });
  useEffect(() => {
    if (!loading) setCount(data?.queryScenes.count ?? 0);
  }, [data, loading]);

  if (!loading && !data) return <ErrorMessage error="Failed to load scenes." />;

  const scenes = (data?.queryScenes.scenes ?? []).map((scene) => (
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
          count={count}
          perPage={PER_PAGE}
          active={page}
          showCount
        />
      </div>
      {loading ? (
        <LoadingIndicator message="Loading tags..." />
      ) : (
        <div className="performers row">{scenes}</div>
      )}
      <div className="row">
        <Pagination
          onClick={setPage}
          count={count}
          perPage={PER_PAGE}
          active={page}
        />
      </div>
    </>
  );
};

export default ScenesComponent;
