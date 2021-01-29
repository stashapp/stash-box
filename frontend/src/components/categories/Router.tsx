import React from "react";
import { Route, Switch } from "react-router-dom";

import Category from "./Category";
import Categories from "./ListCategories";
import CategoryAdd from "./AddCategory";
import CategoryEdit from "./EditCategory";

const CategoriesRouter: React.FC = () => (
  <Switch>
    <Route exact path="/categories">
      <Categories />
    </Route>
    <Route exact path="/categories/add">
      <CategoryAdd />
    </Route>
    <Route exact path="/categories/:id/edit">
      <CategoryEdit />
    </Route>
    <Route exact path="/categories/:id">
      <Category />
    </Route>
  </Switch>
);

export default CategoriesRouter;
