import React, { useContext } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Link, useHistory, useParams } from "react-router-dom";
import { Button } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Category, CategoryVariables } from "src/definitions/Category";
import {
  DeleteCategoryMutation,
  DeleteCategoryMutationVariables,
} from "src/definitions/DeleteCategoryMutation";

import AuthContext from "src/AuthContext";
import { canEdit, isAdmin } from "src/utils/auth";
import { LoadingIndicator } from "src/components/fragments";
import DeleteButton from "src/components/deleteButton";
import TagList from "src/components/tagList";

const CategoryQuery = loader("src/queries/Category.gql");
const DeleteCategory = loader("src/mutations/DeleteCategory.gql");

const TagComponent: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const auth = useContext(AuthContext);

  const { data, loading } = useQuery<Category, CategoryVariables>(
    CategoryQuery,
    {
      variables: { id },
    }
  );

  const [deleteCategory, { loading: deleting }] = useMutation<
    DeleteCategoryMutation,
    DeleteCategoryMutationVariables
  >(DeleteCategory, {
    onCompleted: (result) => {
      if (result) history.push("/categories");
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
      <div className="row no-gutters">
        <h3 className="col-4 mr-auto">
          <span className="mr-2">Category:</span>
          <em>{category.name}</em>
        </h3>
        {canEdit(auth.user) && (
          <Link to={`/categories/${category.id}/edit`} className="mr-2">
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
