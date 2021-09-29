import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "react-bootstrap";

import { useSites } from "src/graphql";
import { LoadingIndicator, SiteLink } from "src/components/fragments";
import { isAdmin, createHref } from "src/utils";
import { ROUTE_SITE, ROUTE_SITE_ADD } from "src/constants/route";
import AuthContext from "src/AuthContext";

const SiteList: React.FC = () => {
  const auth = useContext(AuthContext);
  const { loading, data } = useSites();

  return (
    <>
      <div className="d-flex no-gutters">
        <h3 className="me-4">Sites</h3>
        {isAdmin(auth.user) && (
          <Link to={ROUTE_SITE_ADD} className="ms-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <Card>
        <Card.Body className="p-4">
          {loading && <LoadingIndicator message="Loading sites..." />}
          <ul>
            {(data?.querySites.sites ?? []).map((site) => (
              <li key={site.id}>
                <Link to={createHref(ROUTE_SITE, site)}>
                  <SiteLink site={site} />
                </Link>
                {site.description && (
                  <span className="ms-2">
                    &bull;
                    <small className="ms-2">{site.description}</small>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>
    </>
  );
};

export default SiteList;
