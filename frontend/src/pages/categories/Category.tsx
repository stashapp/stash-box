import React, { useContext } from "react";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";

import { useCategory, useDeleteCategory } from "src/graphql";
import AuthContext from "src/AuthContext";
import { canEdit, isAdmin, createHref } from "src/utils";
import { LoadingIndicator } from "src/components/fragments";
import DeleteButton from "src/components/deleteButton";
import { TagList } from "src/components/list";
import { ROUTE_CATEGORIES, ROUTE_CATEGORY_EDIT } from "src/constants/route";

const TagComponent: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const auth = useContext(AuthContext);

  const { data, loading } = useCategory({ id });

  const [deleteCategory, { loading: deleting }] = useDeleteCategory({
    onCompleted: (result) => {
      if (result) history.push(ROUTE_CATEGORIES);
    },
  });

  const handleDelete = () => {
    deleteCategory({
      variables: {
        input: { id: data?.findTagCategory?.id ?? "" },
      },
    });
  };

  if (loading) return <LoadingIndicator message="Loading..." />;

  if (!data?.findTagCategory?.id) return <div>Category not found!</div>;

  const category = data.findTagCategory;

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

export default TagComponent;
