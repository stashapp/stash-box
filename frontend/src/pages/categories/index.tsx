import { useReadQuery } from "@apollo/client/react";
import { createRoute, Outlet, useLoaderData } from "@tanstack/react-router";
import type { FC } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import { CategoryDocument } from "src/graphql";
import { adminRoute, narrowRoute } from "src/routing/layouts";
import { requireEntity } from "src/routing/requireEntity";
import { validateTextSearch } from "src/routing/searchValidators";

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

const categoriesRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "categories",
});

const categoriesListRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: "/",
  component: CategoryListPage,
});

const categoriesAddRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: "add",
  component: CategoryAddPage,
});

const categoriesEntityRoute = createRoute({
  getParentRoute: () => categoriesRoute,
  path: "$id",
  validateSearch: validateTextSearch,
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(CategoryDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: CategoryDocument, variables })?.findTagCategory,
    );
    return { queryRef };
  },
  pendingComponent: () => (
    <PageSkeleton kind="detail" label="Loading category" />
  ),
  notFoundComponent: () => <ErrorMessage error="Category not found." />,
  component: Outlet,
});

const categoriesEditRoute = createRoute({
  getParentRoute: () => categoriesEntityRoute,
  path: "edit",
  component: () => <CategoryEditPage from="/narrow/categories/$id" />,
});

const categoriesDetailRoute = createRoute({
  getParentRoute: () => categoriesEntityRoute,
  path: "/",
  component: () => <CategoryDetailPage from="/narrow/categories/$id" />,
});

const adminCategoriesRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: "categories",
});

const adminCategoriesListRoute = createRoute({
  getParentRoute: () => adminCategoriesRoute,
  path: "/",
  component: CategoryListPage,
});

const adminCategoriesAddRoute = createRoute({
  getParentRoute: () => adminCategoriesRoute,
  path: "add",
  component: CategoryAddPage,
});

const adminCategoriesEntityRoute = createRoute({
  getParentRoute: () => adminCategoriesRoute,
  path: "$id",
  validateSearch: validateTextSearch,
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(CategoryDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: CategoryDocument, variables })?.findTagCategory,
    );
    return { queryRef };
  },
  pendingComponent: () => (
    <PageSkeleton kind="detail" label="Loading category" />
  ),
  notFoundComponent: () => <ErrorMessage error="Category not found." />,
  component: Outlet,
});

const adminCategoriesEditRoute = createRoute({
  getParentRoute: () => adminCategoriesEntityRoute,
  path: "edit",
  component: () => <CategoryEditPage from="/narrow/admin/categories/$id" />,
});

const adminCategoriesDetailRoute = createRoute({
  getParentRoute: () => adminCategoriesEntityRoute,
  path: "/",
  component: () => <CategoryDetailPage from="/narrow/admin/categories/$id" />,
});

export const categoryRoutes = categoriesRoute.addChildren([
  categoriesListRoute,
  categoriesAddRoute,
  categoriesEntityRoute.addChildren([
    categoriesEditRoute,
    categoriesDetailRoute,
  ]),
]);

export const adminCategoryRoutes = adminCategoriesRoute.addChildren([
  adminCategoriesListRoute,
  adminCategoriesAddRoute,
  adminCategoriesEntityRoute.addChildren([
    adminCategoriesEditRoute,
    adminCategoriesDetailRoute,
  ]),
]);
