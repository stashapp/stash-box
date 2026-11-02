import { type QueryRef, useReadQuery } from "@apollo/client/react";
import type { FC } from "react";
import Title from "src/components/title";
import type { CategoryQuery } from "src/graphql";
import { requireEntity } from "src/routing/requireEntity";

import Categories from "./Categories";
import Category from "./Category";
import CategoryAdd from "./CategoryAdd";
import CategoryEdit from "./CategoryEdit";

interface CategoryPageProps {
  queryRef: QueryRef<CategoryQuery>;
}

export const CategoryEditPage: FC<CategoryPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const category = requireEntity(data.findTagCategory);

  return (
    <>
      <Title page={`Edit Category "${category.name}"`} />
      <CategoryEdit category={category} />
    </>
  );
};

export const CategoryDetailPage: FC<CategoryPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const category = requireEntity(data.findTagCategory);

  return (
    <>
      <Title page={`Category "${category.name}"`} />
      <Category category={category} />
    </>
  );
};

export const CategoryListPage: FC = () => (
  <>
    <Title page="Categories" />
    <Categories />
  </>
);

export const CategoryAddPage: FC = () => (
  <>
    <Title page="Add Category" />
    <CategoryAdd />
  </>
);

export default CategoryDetailPage;
