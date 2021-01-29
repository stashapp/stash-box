import React from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useHistory, useParams } from "react-router-dom";
import { loader } from "graphql.macro";

import { Category, CategoryVariables } from "src/definitions/Category";
import {
  UpdateTagCategoryMutation,
  UpdateTagCategoryMutationVariables,
} from "src/definitions/UpdateTagCategoryMutation";
import { TagCategoryCreateInput } from "src/definitions/globalTypes";

import { LoadingIndicator } from "src/components/fragments";
import CategoryForm from "./CategoryForm";

const UpdateCategoryMutation = loader("src/mutations/UpdateCategory.gql");
const FindCategoryQuery = loader("src/queries/Category.gql");

const UpdateCategory: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const { data, loading } = useQuery<Category, CategoryVariables>(
    FindCategoryQuery,
    { variables: { id } }
  );
  const [updateCategory] = useMutation<
    UpdateTagCategoryMutation,
    UpdateTagCategoryMutationVariables
  >(UpdateCategoryMutation, {
    onCompleted: (result) => {
      if (result?.tagCategoryUpdate?.id)
        history.push(`/categories/${result.tagCategoryUpdate.id}`);
    },
  });

  const doUpdate = (insertData: TagCategoryCreateInput) => {
    updateCategory({
      variables: {
        categoryData: {
          id,
          ...insertData,
        },
      },
    });
  };

  if (loading) return <LoadingIndicator message="Loading category..." />;
  if (!data?.findTagCategory?.id) return <div>Category not found</div>;

  const category = data.findTagCategory;

  return (
    <div>
      <h2>
        Update <em>{category.name}</em>
      </h2>
      <hr />
      <CategoryForm callback={doUpdate} category={category} id={id} />
    </div>
  );
};

export default UpdateCategory;
