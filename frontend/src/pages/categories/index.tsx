import React from "react";
import { Route, Switch } from "react-router-dom";

import {
  ROUTE_CATEGORY,
  ROUTE_CATEGORY_ADD,
  ROUTE_CATEGORY_EDIT,
  ROUTE_CATEGORIES,
} from "src/constants/route";

import Category from "./Category";
import Categories from "./Categories";
import CategoryAdd from "./CategoryAdd";
import CategoryEdit from "./CategoryEdit";

const CategoryRoutes: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_CATEGORIES}>
      <Categories />
    </Route>
    <Route exact path={ROUTE_CATEGORY_ADD}>
      <CategoryAdd />
    </Route>
    <Route exact path={ROUTE_CATEGORY_EDIT}>
      <CategoryEdit />
    </Route>
    <Route exact path={ROUTE_CATEGORY}>
      <Category />
    </Route>
  </Switch>
);

export default CategoryRoutes;
