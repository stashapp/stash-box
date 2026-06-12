import { sortBy } from "lodash-es";
import type { FC } from "react";
import { Button, Row } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import DeleteButton from "src/components/deleteButton";
import { SiteLink } from "src/components/fragments";
import {
  ROUTE_SITE_CATEGORIES,
  ROUTE_SITE_CATEGORY_EDIT,
} from "src/constants/route";
import {
  type SiteCategoryQuery,
  useDeleteSiteCategory,
  useSites,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { createHref } from "src/utils";

type SiteCategory = NonNullable<SiteCategoryQuery["findSiteCategory"]>;

interface Props {
  category: SiteCategory;
}

const SiteCategoryComponent: FC<Props> = ({ category }) => {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const { data: siteData } = useSites();

  const [deleteCategory, { loading: deleting }] = useDeleteSiteCategory({
    onCompleted: (result) => {
      if (result) navigate(ROUTE_SITE_CATEGORIES);
    },
  });

  const handleDelete = () => {
    deleteCategory({
      variables: {
        input: { id: category.id },
      },
    });
  };

  const sites = sortBy(
    (siteData?.querySites.sites ?? []).filter(
      (site) => site.category?.id === category.id,
    ),
    (site) => site.name.toLowerCase(),
  );

  return (
    <>
      <Link to={ROUTE_SITE_CATEGORIES}>
        <h6 className="mb-4">&larr; Site Category List</h6>
      </Link>
      <div className="d-flex">
        <h3 className="me-auto">
          <em>{category.name}</em>
        </h3>
        <div className="ms-auto">
          {isAdmin && (
            <>
              <Link
                to={createHref(ROUTE_SITE_CATEGORY_EDIT, category)}
                className="me-2"
              >
                <Button>Edit</Button>
              </Link>
              <DeleteButton
                onClick={handleDelete}
                disabled={deleting}
                message="Do you want to delete this category? Sites in it will become uncategorized."
              />
            </>
          )}
        </div>
      </div>
      {category.description && (
        <Row className="g-0">
          <b className="me-2">Description:</b>
          <span>{category.description}</span>
        </Row>
      )}
      <Row className="g-0">
        <b className="me-2">Sort order:</b>
        <span>{category.sort_order}</span>
      </Row>
      <hr className="my-2 mb-4" />
      <ul className="ps-0">
        {sites.map((site) => (
          <li key={site.id} className="d-block">
            <SiteLink site={site} noMargin />
          </li>
        ))}
      </ul>
    </>
  );
};

export default SiteCategoryComponent;
