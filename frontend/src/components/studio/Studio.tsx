import React, { useContext } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Studio, StudioVariables } from "src/definitions/Studio";
import { Scenes, ScenesVariables } from "src/definitions/Scenes";
import {
  CriterionModifier,
  SortDirectionEnum,
} from "src/definitions/globalTypes";
import {
  DeleteStudioMutation,
  DeleteStudioMutationVariables,
} from "src/definitions/DeleteStudioMutation";

import { usePagination } from "src/hooks";
import Pagination from "src/components/pagination";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import SceneCard from "src/components/sceneCard";
import DeleteButton from "src/components/deleteButton";

import { getImage, getUrlByType } from "src/utils/transforms";
import { canEdit, isAdmin } from "src/utils/auth";
import AuthContext from "src/AuthContext";

const DeleteStudio = loader("src/mutations/DeleteStudio.gql");
const StudioQuery = loader("src/queries/Studio.gql");
const ScenesQuery = loader("src/queries/Scenes.gql");

const PER_PAGE = 20;

const StudioComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const history = useHistory();
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
        per_page: PER_PAGE,
        sort: "DATE",
        direction: SortDirectionEnum.DESC,
      },
      sceneFilter: {
        studios: { value: [id], modifier: CriterionModifier.INCLUDES },
      },
    },
    skip: id === "",
  });

  const [deleteStudio, { loading: deleting }] = useMutation<
    DeleteStudioMutation,
    DeleteStudioMutationVariables
  >(DeleteStudio, {
    onCompleted: (result) => {
      if (result.studioDestroy) history.push("/studios/");
    },
  });

  if (loading) return <LoadingIndicator message="Loading studio..." />;
  if (id === "" || !data?.findStudio)
    return <ErrorMessage error="Studio not found." />;

  const studio = data.findStudio;

  const scenes = (sceneData?.queryScenes?.scenes ?? []).map((p) => (
    <SceneCard key={p.id} performance={p} />
  ));

  const handleDelete = () => {
    deleteStudio({
      variables: {
        input: {
          id: studio.id,
        },
      },
    });
  };

  return (
    <>
      <div className="row no-gutters">
        <div className="studio-title">
          <h3>{studio.name}</h3>
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
          <Link to={`${id}/edit`}>
            <Button>Edit</Button>
          </Link>
        )}
        {isAdmin(auth.user) && (
          <DeleteButton
            onClick={handleDelete}
            disabled={deleting}
            message="Do you want to delete studio? This cannot be undone."
          />
        )}
      </div>
      <hr />
      {loadingScenes ? (
        <LoadingIndicator message="Loading scenes..." />
      ) : !sceneData ? (
        <ErrorMessage error="Failed to loading scenes." />
      ) : (
        <>
          <div className="row no-gutters">
            <h3 className="col-4">Scenes</h3>
            <Pagination
              onClick={setPage}
              count={sceneData.queryScenes.count}
              active={page}
              perPage={PER_PAGE}
              showCount
            />
          </div>
          <div className="row">{scenes}</div>
          <div className="row">
            <Pagination
              onClick={setPage}
              count={sceneData.queryScenes.count}
              perPage={PER_PAGE}
              active={page}
            />
          </div>
        </>
      )}
    </>
  );
};

export default StudioComponent;
