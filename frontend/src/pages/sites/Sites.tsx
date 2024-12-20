import { FC } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "react-bootstrap";
import { sortBy } from "lodash-es";

import { useSites } from "src/graphql";
import { LoadingIndicator, SiteLink } from "src/components/fragments";
import { ROUTE_SITE_ADD } from "src/constants/route";
import { useCurrentUser } from "src/hooks";

const SiteList: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { loading, data } = useSites();

  const sites = sortBy(data?.querySites.sites ?? [], (s) =>
    s.name.toLowerCase(),
  );

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Sites</h3>
        {isAdmin && (
          <Link to={ROUTE_SITE_ADD} className="ms-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <Card>
        <Card.Body className="p-4">
          {loading && <LoadingIndicator message="Loading sites..." />}
          <ul className="ps-0">
            {sites.map((site) => (
              <li key={site.id} className="d-block">
                <SiteLink site={site} noMargin />
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
