import React, { useContext } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Studio, StudioVariables } from "src/definitions/Studio";
import { CriterionModifier } from "src/definitions/globalTypes";
import {
  DeleteStudioMutation,
  DeleteStudioMutationVariables,
} from "src/definitions/DeleteStudioMutation";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import DeleteButton from "src/components/deleteButton";
import { SceneList } from "src/components/list";

import { canEdit, isAdmin, getImage, getUrlByType } from "src/utils";
import AuthContext from "src/AuthContext";

const DeleteStudio = loader("src/mutations/DeleteStudio.gql");
const StudioQuery = loader("src/queries/Studio.gql");

const StudioComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const history = useHistory();
  const { id = "" } = useParams();
  const { loading, data } = useQuery<Studio, StudioVariables>(StudioQuery, {
    variables: { id },
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
      <SceneList
        filter={{
          studios: { value: [id], modifier: CriterionModifier.INCLUDES },
        }}
      />
    </>
  );
};

export default StudioComponent;
