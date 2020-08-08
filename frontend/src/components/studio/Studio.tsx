import React, { useContext } from "react";
import { useQuery } from "@apollo/client";
import { Link, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Studio, StudioVariables } from "src/definitions/Studio";
import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import {
  CriterionModifier,
  SortDirectionEnum,
} from "src/definitions/globalTypes";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import { LoadingIndicator } from "src/components/fragments";
import SceneCard from "src/components/sceneCard";

import { getImage, getUrlByType } from "src/utils/transforms";
import { canEdit } from "src/utils/auth";
import AuthContext from "src/AuthContext";

const StudioQuery = loader("src/queries/Studio.gql");
const ScenesQuery = loader("src/queries/Scenes.gql");

const StudioComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const { id = "" } = useParams();
  const { page, setPage } = usePagination();
  const { loading, data } = useQuery<Studio, StudioVariables>(StudioQuery, {
    variables: { id },
    skip: id === "",
  });
  const { loading: loadingScenes, data: sceneData } = useQuery<
    Scenes,
    ScenesVariables
  >(ScenesQuery, {
    variables: {
      filter: {
        page,
        per_page: 20,
        sort: "DATE",
        direction: SortDirectionEnum.DESC,
      },
      sceneFilter: {
        studios: { value: [id], modifier: CriterionModifier.INCLUDES },
      },
    },
    skip: id === "",
  });

  if (loading || loadingScenes)
    return <LoadingIndicator message="Loading studio..." />;
  if (id === "" || !data?.findStudio) return <div>Studio not found!</div>;

  const studio = data.findStudio;

  const totalPages = Math.ceil((sceneData?.queryScenes?.count ?? 0) / 20);
  const scenes = [...(sceneData?.queryScenes?.scenes ?? [])]
    .sort((a, b) => {
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return -1;
    })
    .map((p) => <SceneCard key={p.id} performance={p} />);

  const handleDelete = () => {};

  return (
    <>
      <div className="studio-header">
        <div className="studio-title">
          <h2>{studio.name}</h2>
          <h6>
            <a href={getUrlByType(studio.urls, "HOME")}>
              {getUrlByType(studio.urls, "HOME")}
            </a>
          </h6>
        </div>
        <div className="studio-photo">
          <img src={getImage(studio.images, "landscape")} alt="Studio logo" />
        </div>
        {canEdit(auth.user) && (
          <div className="studio-edit">
            <Link to={`${id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <Button variant="danger" className="ml-2" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )}
      </div>
      <hr />
      {scenes.length === 0 ? (
        <h4>No scenes found for this studio</h4>
      ) : (
        <>
          <div className="row">
            <h3 className="col-4">Scenes</h3>
            <Pagination onClick={setPage} pages={totalPages} active={page} />
          </div>
          <div className="row">{scenes}</div>
          <div className="row">
            <Pagination onClick={setPage} pages={totalPages} active={page} />
          </div>
        </>
      )}
    </>
  );
};

export default StudioComponent;
