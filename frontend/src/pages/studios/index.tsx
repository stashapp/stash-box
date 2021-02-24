import React from "react";
import { Route, Switch } from "react-router-dom";

import {
  ROUTE_STUDIO,
  ROUTE_STUDIO_ADD,
  ROUTE_STUDIOS,
  ROUTE_STUDIO_EDIT,
} from "src/constants/route";

import Studio from "./Studio";
import Studios from "./Studios";
import StudioEdit from "./StudioEdit";
import StudioAdd from "./StudioAdd";

const SceneRoutes: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_STUDIO_ADD}>
      <StudioAdd />
    </Route>
    <Route exact path={ROUTE_STUDIO}>
      <Studio />
    </Route>
    <Route exact path={ROUTE_STUDIOS}>
      <Studios />
    </Route>
    <Route exact path={ROUTE_STUDIO_EDIT}>
      <StudioEdit />
    </Route>
  </Switch>
);

export default SceneRoutes;
