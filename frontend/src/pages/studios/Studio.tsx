import React, { useContext } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";

import { useStudio, useDeleteStudio, CriterionModifier } from "src/graphql";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import DeleteButton from "src/components/deleteButton";
import { SceneList } from "src/components/list";

import {
  canEdit,
  isAdmin,
  getImage,
  getUrlByType,
  createHref,
} from "src/utils";
import { ROUTE_STUDIO_EDIT, ROUTE_STUDIOS } from "src/constants/route";
import AuthContext from "src/AuthContext";

const StudioComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const history = useHistory();
  const { id = "" } = useParams();
  const { loading, data } = useStudio({ id }, id === "");

  const [deleteStudio, { loading: deleting }] = useDeleteStudio({
    onCompleted: (result) => {
      if (result.studioDestroy) history.push(ROUTE_STUDIOS);
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

  const studioImage = getImage(studio.images, "landscape");

  return (
    <>
      <div className="d-flex">
        <div className="studio-title mr-auto">
          <h3>{studio.name}</h3>
          <h6>
            <a
              href={getUrlByType(studio.urls, "HOME")}
              target="_blank"
              rel="noreferrer noopener"
            >
              {getUrlByType(studio.urls, "HOME")}
            </a>
          </h6>
        </div>
        {studioImage && (
          <div className="studio-photo">
            <img src={getImage(studio.images, "landscape")} alt="Studio logo" />
          </div>
        )}
        <div>
          {canEdit(auth.user) && (
            <Link to={createHref(ROUTE_STUDIO_EDIT, { id })} className="ml-2">
              <Button>Edit</Button>
            </Link>
          )}
          {isAdmin(auth.user) && (
            <DeleteButton
              onClick={handleDelete}
              disabled={deleting}
              className="ml-2"
              message="Do you want to delete studio? This cannot be undone."
            />
          )}
        </div>
      </div>
      <SceneList
        filter={{
          studios: { value: [id], modifier: CriterionModifier.INCLUDES },
        }}
      />
    </>
  );
};

export default StudioComponent;
