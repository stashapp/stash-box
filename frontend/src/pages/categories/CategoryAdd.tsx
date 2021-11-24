import React from "react";
import { useHistory } from "react-router-dom";

import { useAddCategory, TagCategoryCreateInput } from "src/graphql";
import { categoryHref } from "src/utils";
import CategoryForm from "./categoryForm";

const AddCategory: React.FC = () => {
  const history = useHistory();
  const [createCategory] = useAddCategory({
    onCompleted: (data) => {
      if (data?.tagCategoryCreate?.id)
        history.push(categoryHref(data.tagCategoryCreate));
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
