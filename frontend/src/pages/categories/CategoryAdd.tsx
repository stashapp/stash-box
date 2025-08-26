import type { FC } from "react";
import { useNavigate } from "react-router-dom";

import { useAddCategory, type TagCategoryCreateInput } from "src/graphql";
import { categoryHref } from "src/utils";
import CategoryForm from "./categoryForm";

const AddCategory: FC = () => {
  const navigate = useNavigate();
  const [createCategory] = useAddCategory({
    onCompleted: (data) => {
      if (data?.tagCategoryCreate?.id)
        navigate(categoryHref(data.tagCategoryCreate));
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
