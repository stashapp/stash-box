import React from "react";
import { useHistory, useParams } from "react-router-dom";

import {
  useCategory,
  useUpdateCategory,
  TagCategoryCreateInput,
} from "src/graphql";
import { LoadingIndicator } from "src/components/fragments";
import { categoryHref } from "src/utils";
import CategoryForm from "./categoryForm";

const UpdateCategory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { data, loading } = useCategory({ id });
  const [updateCategory] = useUpdateCategory({
    onCompleted: (result) => {
      if (result?.tagCategoryUpdate?.id)
        history.push(categoryHref(result.tagCategoryUpdate));
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
      <h3>
        Update <em>{category.name}</em>
      </h3>
      <hr />
      <CategoryForm callback={doUpdate} category={category} id={id} />
    </div>
  );
};

export default UpdateCategory;
