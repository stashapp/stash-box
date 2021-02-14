import React from "react";
import { useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import { loader } from "graphql.macro";

import {
  AddTagCategoryMutation,
  AddTagCategoryMutationVariables,
} from "src/definitions/AddTagCategoryMutation";
import { TagCategoryCreateInput } from "src/definitions/globalTypes";

import CategoryForm from "./categoryForm";

const AddCategoryMutation = loader("src/mutations/AddCategory.gql");

const AddCategory: React.FC = () => {
  const history = useHistory();
  const [createCategory] = useMutation<
    AddTagCategoryMutation,
    AddTagCategoryMutationVariables
  >(AddCategoryMutation, {
    onCompleted: (data) => {
      if (data?.tagCategoryCreate?.id)
        history.push(`/categories/${data.tagCategoryCreate.id}`);
    },
  });

  const doInsert = (insertData: TagCategoryCreateInput) => {
    createCategory({
      variables: {
        categoryData: insertData,
      },
    });
  };

  return (
    <div>
      <h2>Add new tag category</h2>
      <hr />
      <CategoryForm callback={doInsert} />
    </div>
  );
};

export default AddCategory;
