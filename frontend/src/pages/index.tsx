import React from "react";
import { Route, Switch } from "react-router-dom";

import {
  ROUTE_HOME,
  ROUTE_LOGIN,
  ROUTE_USERS,
  ROUTE_PERFORMERS,
  ROUTE_SCENES,
  ROUTE_STUDIOS,
  ROUTE_TAGS,
  ROUTE_EDITS,
  ROUTE_CATEGORIES,
  ROUTE_REGISTER,
  ROUTE_ACTIVATE,
  ROUTE_FORGOT_PASSWORD,
  ROUTE_RESET_PASSWORD,
  ROUTE_SEARCH,
  ROUTE_IMPORT,
  ROUTE_COMPLETE_IMPORT,
  ROUTE_MASSAGE_IMPORT,
} from "src/constants/route";

import Home from "src/pages/home";
import Login from "src/Login";
import Users from "src/pages/users";
import Performers from "src/pages/performers";
import Scenes from "src/pages/scenes";
import Studios from "src/pages/studios";
import Tags from "src/pages/tags";
import Edits from "src/pages/edits";
import Categories from "src/pages/categories";
import RegisterUser from "src/pages/registerUser";
import ActivateUser from "src/pages/activateUser";
import ForgotPassword from "src/pages/forgotPassword";
import ResetPassword from "src/pages/resetPassword";
import Search from "src/pages/search";
import NewImport from "src/pages/newImport";
import CompleteImport from "./completeImport";
import MassageImport from "./massageImport";

const Pages: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_HOME}>
      <Home />
    </Route>
    <Route exact path={ROUTE_LOGIN}>
      <Login />
    </Route>
    <Route path={ROUTE_USERS}>
      <Users />
    </Route>
    <Route path={ROUTE_PERFORMERS}>
      <Performers />
    </Route>
    <Route path={ROUTE_SCENES}>
      <Scenes />
    </Route>
    <Route path={ROUTE_STUDIOS}>
      <Studios />
    </Route>
    <Route path={ROUTE_TAGS}>
      <Tags />
    </Route>
    <Route path={ROUTE_EDITS}>
      <Edits />
    </Route>
    <Route path={ROUTE_CATEGORIES}>
      <Categories />
    </Route>
    <Route exact path={ROUTE_REGISTER}>
      <RegisterUser />
    </Route>
    <Route exact path={ROUTE_ACTIVATE}>
      <ActivateUser />
    </Route>
    <Route exact path={ROUTE_FORGOT_PASSWORD}>
      <ForgotPassword />
    </Route>
    <Route exact path={ROUTE_RESET_PASSWORD}>
      <ResetPassword />
    </Route>
    <Route exact path={ROUTE_SEARCH}>
      <Search />
    </Route>
    <Route exact path={ROUTE_IMPORT}>
      <NewImport />
    </Route>
    <Route exact path={ROUTE_MASSAGE_IMPORT}>
      <MassageImport />
    </Route>
    <Route exact path={ROUTE_COMPLETE_IMPORT}>
      <CompleteImport />
    </Route>
  </Switch>
);

export default Pages;
