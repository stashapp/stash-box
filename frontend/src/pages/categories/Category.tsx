import React, { useContext } from "react";
import { Link, useHistory } from "react-router-dom";
import { Button } from "react-bootstrap";

import { Category_findTagCategory as Category } from "src/graphql/definitions/Category";
import { useDeleteCategory } from "src/graphql";
import AuthContext from "src/AuthContext";
import { canEdit, isAdmin, createHref } from "src/utils";
import DeleteButton from "src/components/deleteButton";
import { TagList } from "src/components/list";
import { ROUTE_CATEGORIES, ROUTE_CATEGORY_EDIT } from "src/constants/route";

interface Props {
  category: Category;
}

const CategoryComponent: React.FC<Props> = ({ category }) => {
  const history = useHistory();
  const auth = useContext(AuthContext);

  const [deleteCategory, { loading: deleting }] = useDeleteCategory({
    onCompleted: (result) => {
      if (result) history.push(ROUTE_CATEGORIES);
    },
  });

  const handleDelete = () => {
    deleteCategory({
      variables: {
        input: { id: category.id },
      },
    });
  };

  return (
    <>
      <Link to={ROUTE_CATEGORIES}>
        <h6 className="mb-4">&larr; Category List</h6>
      </Link>
      <div className="row no-gutters">
        <h3 className="col-4 mr-auto">
          <em>{category.name}</em>
        </h3>
        {canEdit(auth.user) && (
          <Link to={createHref(ROUTE_CATEGORY_EDIT, category)} className="mr-2">
            <Button>Edit</Button>
          </Link>
        )}
        {isAdmin(auth.user) && (
          <DeleteButton
            onClick={handleDelete}
            disabled={deleting}
            message="Do you want to delete category? This is only possible if no tags are attached."
          />
        )}
      </div>
      {category.description && (
        <div className="row no-gutters">
          <b className="mr-2">Description:</b>
          <span>{category.description}</span>
        </div>
      )}
      <hr className="my-2 mb-4" />
      <TagList tagFilter={{ category_id: category.id }} />
    </>
  );
};

export default CategoryComponent;
