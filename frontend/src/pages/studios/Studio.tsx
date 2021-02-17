import React, { useContext } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { sortBy } from "lodash";

import { useStudio, useDeleteStudio } from "src/graphql";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import DeleteButton from "src/components/deleteButton";
import { SceneList } from "src/components/list";

import {
  canEdit,
  isAdmin,
  getImage,
  getUrlByType,
  createHref,
  studioHref,
} from "src/utils";
import { ROUTE_STUDIO_EDIT, ROUTE_STUDIOS } from "src/constants/route";
import AuthContext from "src/AuthContext";

const StudioComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const history = useHistory();
  const { id = "" } = useParams<{ id?: string }>();
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

  const subStudios = sortBy(studio.child_studios, (s) => s.name).map((s) => (
    <li key={s.id}>
      <Link to={studioHref(s)}>{s.name}</Link>
    </li>
  ));

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
          {studio.parent && (
            <span>
              Part of{" "}
              <b>
                <Link to={studioHref(studio.parent)}>{studio.parent.name}</Link>
              </b>
            </span>
          )}
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
      {subStudios.length > 0 && (
        <>
          <h6>Sub Studios</h6>
          <ul style={{ columnCount: 3 }}>{subStudios}</ul>
        </>
      )}
      <>
        {subStudios.length > 0 && <h4>Scenes</h4>}
        <SceneList filter={{ parentStudio: id }} />
      </>
    </>
  );
};

export default StudioComponent;
