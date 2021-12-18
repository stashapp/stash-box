import React, { useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";

import { Site_findSite as Site } from "src/graphql/definitions/Site";
import { useDeleteSite } from "src/graphql";
import AuthContext from "src/AuthContext";
import { isAdmin, createHref } from "src/utils";
import { SiteLink } from "src/components/fragments";
import DeleteButton from "src/components/deleteButton";
import { ROUTE_SITES, ROUTE_SITE_EDIT } from "src/constants/route";

interface Props {
  site: Site;
}

const SiteComponent: React.FC<Props> = ({ site }) => {
  const history = useHistory();
  const auth = useContext(AuthContext);

  const [deleteSite, { loading: deleting }] = useDeleteSite({
    onCompleted: (result) => {
      if (result) history.push(ROUTE_SITES);
    },
  });

  const handleDelete = () => {
    deleteSite({
      variables: {
        input: { id: site.id },
      },
    });
  };

  return (
    <>
      <Link to={ROUTE_SITES}>
        <h6 className="mb-4">&larr; Site List</h6>
      </Link>
      <div className="d-flex">
        <h3 className="me-auto">
          <SiteLink site={site} />
        </h3>
        {isAdmin(auth.user) && (
          <div className="ms-auto">
            <Link to={createHref(ROUTE_SITE_EDIT, site)} className="me-2">
              <Button>Edit</Button>
            </Link>
            <DeleteButton
              onClick={handleDelete}
              disabled={deleting}
              message="Do you want to delete the site? This is only possible if no links are attached."
            />
          </div>
        )}
      </div>
      <dl>
        <dt>Valid targets</dt>
        <dd>{site.valid_types.join(", ")}</dd>
        {site.description && (
          <>
            <dt>Description:</dt>
            <dd>{site.description}</dd>
          </>
        )}
        {site.url && (
          <>
            <dt>URL:</dt>
            <dd>{site.url}</dd>
          </>
        )}
        {site.regex && (
          <>
            <dt>Regular Expression:</dt>
            <dd>
              <code>{site.regex}</code>
            </dd>
          </>
        )}
      </dl>
    </>
  );
};

export default SiteComponent;
