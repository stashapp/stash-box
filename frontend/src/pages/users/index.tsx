import React from "react";
import { Route, Switch } from "react-router-dom";

import {
  ROUTE_USERS,
  ROUTE_USER,
  ROUTE_USER_ADD,
  ROUTE_USER_EDIT,
  ROUTE_USER_PASSWORD,
  ROUTE_USER_EDITS,
} from "src/constants/route";

import Users from "./Users";
import User from "./User";
import UserAdd from "./UserAdd";
import UserEdit from "./UserEdit";
import UserPassword from "./UserPassword";
import UserEdits from "./UserEdits";

const UserRoutes: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_USERS}>
      <Users />
    </Route>
    <Route exact path={ROUTE_USER_ADD}>
      <UserAdd />
    </Route>
    <Route exact path={ROUTE_USER_PASSWORD}>
      <UserPassword />
    </Route>
    <Route exact path={ROUTE_USER}>
      <User />
    </Route>
    <Route exact path={ROUTE_USER_EDIT}>
      <UserEdit />
    </Route>
    <Route exact path={ROUTE_USER_EDITS}>
      <UserEdits />
    </Route>
  </Switch>
);

export default UserRoutes;
