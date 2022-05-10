import { FC } from "react";
import { Route, Switch } from "react-router-dom";

import {
  ROUTE_EDITS,
  ROUTE_EDIT,
  ROUTE_EDIT_UPDATE,
} from "src/constants/route";

import Edit from "./Edit";
import Edits from "./Edits";
import EditUpdate from "./EditUpdate";

const SceneRoutes: FC = () => (
  <Switch>
    <Route exact path={ROUTE_EDITS}>
      <Edits />
    </Route>
    <Route exact path={ROUTE_EDIT_UPDATE}>
      <EditUpdate />
    </Route>
    <Route exact path={ROUTE_EDIT}>
      <Edit />
    </Route>
  </Switch>
);

export default SceneRoutes;
