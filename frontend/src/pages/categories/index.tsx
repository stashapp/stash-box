import { Outlet, useParams } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import type { CategoryQuery } from "src/graphql";
import { useCategory } from "src/graphql";

import Categories from "./Categories";
import Category from "./Category";
import CategoryAdd from "./CategoryAdd";
import CategoryEdit from "./CategoryEdit";

const CategoryContext = createContext<NonNullable<
  CategoryQuery["findTagCategory"]
> | null>(null);
export const CategoryLayout = () => {
  const { id } = useParams({ strict: false });
  const { data, loading } = useCategory({ id: id ?? "" }, !id);
  if (loading) return <PageSkeleton kind="detail" label="Loading category" />;
  const category = data?.findTagCategory;
  if (!category) return <ErrorMessage error="Category not found." />;
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
