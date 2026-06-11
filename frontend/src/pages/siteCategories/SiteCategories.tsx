import { sortBy } from "lodash-es";
import type { FC } from "react";
import { Button, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import {
  ROUTE_SITE_CATEGORY,
  ROUTE_SITE_CATEGORY_ADD,
} from "src/constants/route";
import { useSiteCategories } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { createHref } from "src/utils";

const SiteCategoryList: FC = () => {
  const { isAdmin } = useCurrentUser();
  const { loading, data } = useSiteCategories();

  const categories = sortBy(data?.querySiteCategories?.site_categories ?? [], [
    (cat) => cat.sort_order,
    (cat) => cat.name.toLowerCase(),
  ]).map((category) => (
    <li key={category.id}>
      <Link to={createHref(ROUTE_SITE_CATEGORY, category)}>
        {category.name}
      </Link>
      {category.description && (
        <span className="ms-2">
          &bull;
          <small className="ms-2">{category.description}</small>
        </span>
      )}
    </li>
  ));

  return (
    <>
      <div className="d-flex">
        <h3 className="me-4">Site Categories</h3>
        {isAdmin && (
          <Link to={ROUTE_SITE_CATEGORY_ADD} className="ms-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <Card>
        <Card.Body className="p-4">
          {loading && <LoadingIndicator message="Loading site categories..." />}
          {!loading && <ul>{categories}</ul>}
        </Card.Body>
      </Card>
    </>
  );
};

export default SiteCategoryList;
