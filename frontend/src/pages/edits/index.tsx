import React from "react";
import { Route, Switch } from "react-router-dom";

import { ROUTE_EDITS, ROUTE_EDIT } from "src/constants/route";

import Edit from "./Edit";
import Edits from "./Edits";

const SceneRoutes: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_EDITS}>
      <Edits />
    </Route>
    <Route exact path={ROUTE_EDIT}>
      <Edit />
    </Route>
  </Switch>
);

export default SceneRoutes;
