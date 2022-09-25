import { FC } from "react";
import { useHistory } from "react-router-dom";

import {
  useUpdateCategory,
  TagCategoryCreateInput,
  CategoryQuery,
} from "src/graphql";
import { categoryHref } from "src/utils";
import CategoryForm from "./categoryForm";

type Category = NonNullable<CategoryQuery["findTagCategory"]>;

interface Props {
  category: Category;
}

const UpdateCategory: FC<Props> = ({ category }) => {
  const history = useHistory();
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
