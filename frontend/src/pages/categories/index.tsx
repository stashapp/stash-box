import { useReadQuery } from "@apollo/client/react";
import { useLoaderData } from "@tanstack/react-router";
import type { FC } from "react";
import Title from "src/components/title";
import { requireEntity } from "src/routing/requireEntity";

import Categories from "./Categories";
import Category from "./Category";
import CategoryAdd from "./CategoryAdd";
import CategoryEdit from "./CategoryEdit";

interface CategoryPageProps {
  from: "/narrow/categories/$id" | "/narrow/admin/categories/$id";
}

export const CategoryEditPage: FC<CategoryPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery(queryRef);
  const category = requireEntity(data.findTagCategory);

  return (
    <>
      <Title page={`Edit Category "${category.name}"`} />
      <CategoryEdit category={category} />
    </>
  );
};

export const CategoryDetailPage: FC<CategoryPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
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
