import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";

import {
  type CategoryQuery,
  type TagCategoryCreateInput,
  useUpdateCategory,
} from "src/graphql";
import CategoryForm from "./categoryForm";

type Category = NonNullable<CategoryQuery["findTagCategory"]>;

interface Props {
  category: Category;
}

const UpdateCategory: FC<Props> = ({ category }) => {
  const navigate = useNavigate();
  const [updateCategory] = useUpdateCategory({
    onCompleted: (result) => {
      if (result?.tagCategoryUpdate?.id)
        navigate({ to: "/categories/$id", params: result.tagCategoryUpdate });
    },
  });

  const doUpdate = (insertData: TagCategoryCreateInput) => {
    updateCategory({
      variables: {
        categoryData: {
          id: category.id,
          ...insertData,
        },
      },
    });
  };

  return (
    <div>
      <h3>
        Update <em>{category.name}</em>
      </h3>
      <hr />
      <CategoryForm callback={doUpdate} category={category} id={category.id} />
    </div>
  );
};

export default UpdateCategory;
