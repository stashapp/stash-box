import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";

import { type TagCategoryCreateInput, useAddCategory } from "src/graphql";
import CategoryForm from "./categoryForm";

const AddCategory: FC = () => {
  const navigate = useNavigate();
  const [createCategory] = useAddCategory({
    onCompleted: (data) => {
      if (data?.tagCategoryCreate?.id)
        navigate({ to: "/categories/$id", params: data.tagCategoryCreate });
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
      <h3>Add new tag category</h3>
      <hr />
      <CategoryForm callback={doInsert} />
    </div>
  );
};

export default AddCategory;
