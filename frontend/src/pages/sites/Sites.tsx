import { groupBy, sortBy } from "lodash-es";
import type { FC } from "react";
import { Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { LoadingIndicator, SiteLink } from "src/components/fragments";
import { ROUTE_SITE_ADD, ROUTE_SITE_CATEGORIES } from "src/constants/route";
import { useSites } from "src/graphql";
import { useCurrentUser } from "src/hooks";

const SiteList: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { loading, data } = useSites();

  const sites = sortBy(data?.querySites.sites ?? [], (s) =>
    s.name.toLowerCase(),
  );

  const hasCategories = sites.some((s) => s.category);
  const groups = sortBy(
    Object.values(groupBy(sites, (s) => s.category?.id ?? "")),
    [
      (group) => (group[0].category ? 0 : 1),
      (group) => group[0].category?.sort_order ?? 0,
      (group) => group[0].category?.name.toLowerCase(),
    ],
  );

  const renderSite = (site: (typeof sites)[number]) => (
    <li key={site.id} className="d-block">
      <SiteLink site={site} noMargin />
      {site.description && (
        <span className="ms-2">
          &bull;
          <small className="ms-2">{site.description}</small>
        </span>
      )}
    </li>
  );

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Sites</h3>
        {isAdmin && (
          <div className="ms-auto">
            <Link to={ROUTE_SITE_CATEGORIES} className="me-2">
              <Button variant="secondary">Categories</Button>
            </Link>
            <Link to={ROUTE_SITE_ADD}>
              <Button>Create</Button>
            </Link>
          </div>
        )}
      </div>
      <Card>
        <Card.Body className="p-4">
          {loading && <LoadingIndicator message="Loading sites..." />}
          {!hasCategories ? (
            <ul className="ps-0">{sites.map(renderSite)}</ul>
          ) : (
            groups.map((group) => (
              <div key={group[0].category?.id ?? "other"}>
                <h6>{group[0].category?.name ?? "Other"}</h6>
                <ul className="ps-0">{group.map(renderSite)}</ul>
              </div>
            ))
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default SiteList;
