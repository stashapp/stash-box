import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@apollo/client";
import { Button, Card } from "react-bootstrap";
import { loader } from "graphql.macro";
import { sortBy, groupBy } from "lodash";

import { Categories, CategoriesVariables } from "src/definitions/Categories";

import { LoadingIndicator } from "src/components/fragments";
import { isAdmin, createHref } from "src/utils";
import { ROUTE_CATEGORY } from "src/constants/route";
import AuthContext from "src/AuthContext";

const CategoriesQuery = loader("src/queries/Categories.gql");

const CategoryList: React.FC = () => {
  const auth = useContext(AuthContext);
  const { loading, data } = useQuery<Categories, CategoriesVariables>(
    CategoriesQuery
  );

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
          <Link to="/categories/add" className="ml-auto">
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
