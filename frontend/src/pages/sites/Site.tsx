import type { FC } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import DeleteButton from "src/components/deleteButton";
import { SiteLink } from "src/components/fragments";
import {
  ROUTE_SITE_CATEGORY,
  ROUTE_SITE_EDIT,
  ROUTE_SITES,
} from "src/constants/route";
import { type SiteQuery, useDeleteSite } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { createHref } from "src/utils";

type Site = NonNullable<SiteQuery["findSite"]>;

interface Props {
  site: Site;
}

const SiteComponent: FC<Props> = ({ site }) => {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();

  const [deleteSite, { loading: deleting }] = useDeleteSite({
    onCompleted: (result) => {
      if (result) navigate(ROUTE_SITES);
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
        {isAdmin && (
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
        <dt>Link visibility</dt>
        <dd>
          {site.highlighted
            ? "Highlighted on entity pages"
            : "Links section only"}
        </dd>
        {site.category && (
          <>
            <dt>Category:</dt>
            <dd>
              <Link to={createHref(ROUTE_SITE_CATEGORY, site.category)}>
                {site.category.name}
              </Link>
            </dd>
          </>
        )}
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
