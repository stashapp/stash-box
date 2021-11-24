import { FC } from "react";
import { useParams, Route, Switch } from "react-router-dom";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";

import {
  ROUTE_CATEGORY,
  ROUTE_CATEGORY_ADD,
  ROUTE_CATEGORY_EDIT,
  ROUTE_CATEGORIES,
} from "src/constants/route";
import { useCategory } from "src/graphql";

import Category from "./Category";
import Categories from "./Categories";
import CategoryAdd from "./CategoryAdd";
import CategoryEdit from "./CategoryEdit";

const CategoryLoader: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useCategory({ id });

  if (!id) return <ErrorMessage error="Category ID is required" />;
  if (loading) return <LoadingIndicator message="Loading..." />;
  if (!data?.findTagCategory)
    return <ErrorMessage error="Category not found" />;

  return (
    <Switch>
      <Route exact path={ROUTE_CATEGORY_EDIT}>
        <>
          <Title page={`Edit Category "${data.findTagCategory.name}"`} />
          <CategoryEdit category={data.findTagCategory} />
        </>
      </Route>
      <Route exact path={ROUTE_CATEGORY}>
        <>
          <Title page={`Category "${data.findTagCategory.name}"`} />
          <Category category={data.findTagCategory} />
        </>
      </Route>
    </Switch>
  );
};

const CategoryRoutes: FC = () => (
  <Switch>
    <Route exact path={ROUTE_CATEGORIES}>
      <>
        <Title page="Categories" />
        <Categories />
      </>
    </Route>
    <Route exact path={ROUTE_CATEGORY_ADD}>
      <>
        <Title page="Add Category" />
        <CategoryAdd />
      </>
    </Route>
    <Route path={ROUTE_CATEGORY}>
      <CategoryLoader />
    </Route>
  </Switch>
);

export default CategoryRoutes;
