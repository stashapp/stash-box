import { type QueryRef, useReadQuery } from "@apollo/client/react";
import { Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";
import Title from "src/components/title";

import type { CategoryQuery } from "src/graphql";
import { requireEntity } from "src/routing/requireEntity";
import Categories from "./Categories";
import Category from "./Category";
import CategoryAdd from "./CategoryAdd";
import CategoryEdit from "./CategoryEdit";

const CategoryContext = createContext<NonNullable<
  CategoryQuery["findTagCategory"]
> | null>(null);
export const CategoryLayout = ({
  queryRef,
}: {
  queryRef: QueryRef<CategoryQuery>;
}) => {
  const { data } = useReadQuery(queryRef);
  const category = requireEntity(data.findTagCategory);
  return (
    <CategoryContext.Provider value={category}>
      <Outlet />
    </CategoryContext.Provider>
  );
};

export const CategoryEditPage: FC = () => {
  const value = useContext(CategoryContext);
  if (!value) throw new Error("Category layout is missing");
  const category = value;
  return (
    <>
      <Title page={`Edit Category "${category.name}"`} />
      <CategoryEdit category={category} />
    </>
  );
};

export const CategoryDetailPage: FC = () => {
  const value = useContext(CategoryContext);
  if (!value) throw new Error("Category layout is missing");
  const category = value;
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

export default CategoryLayout;
