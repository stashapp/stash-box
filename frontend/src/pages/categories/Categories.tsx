import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "react-bootstrap";
import { sortBy, groupBy } from "lodash-es";

import { useCategories } from "src/graphql";
import { LoadingIndicator } from "src/components/fragments";
import { isAdmin, createHref } from "src/utils";
import { ROUTE_CATEGORY, ROUTE_CATEGORY_ADD } from "src/constants/route";
import AuthContext from "src/AuthContext";

const CategoryList: React.FC = () => {
  const auth = useContext(AuthContext);
  const { loading, data } = useCategories();

  const categoryGroups = groupBy(
    sortBy(data?.queryTagCategories?.tag_categories ?? [], (cat) => cat.name),
    (cat) => cat.group
  );

  const categories = Object.keys(categoryGroups).map((group) => (
    <div key={group}>
      <h6>{group}</h6>
      <ul>
        {categoryGroups[group].map((category) => (
          <li key={category.id}>
            <Link to={createHref(ROUTE_CATEGORY, category)}>
              {category.name}
            </Link>
            {category.description && (
              <span className="ml-2">
                &bull;
                <small className="ml-2">{category.description}</small>
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  ));

  return (
    <>
      <div className="row no-gutters">
        <h3 className="mr-4">Categories</h3>
        {isAdmin(auth.user) && (
          <Link to={ROUTE_CATEGORY_ADD} className="ml-auto">
            <Button>Create</Button>
          </Link>
        )}
      </div>
      <Card>
        <Card.Body className="p-4">
          {loading && <LoadingIndicator message="Loading categories..." />}
          {!loading && categories}
        </Card.Body>
      </Card>
    </>
  );
};

export default CategoryList;
