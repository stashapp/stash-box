import React from "react";
import { Route, Switch } from "react-router-dom";

import {
  ROUTE_PERFORMER,
  ROUTE_PERFORMERS,
  ROUTE_PERFORMER_ADD,
  ROUTE_PERFORMER_EDIT,
  ROUTE_PERFORMER_MERGE,
  ROUTE_PERFORMER_DELETE,
} from "src/constants/route";

import Performers from "./Performers";
import Performer from "./Performer";
import PerformerAdd from "./PerformerAdd";
import PerformerEdit from "./PerformerEdit";
import PerformerMerge from "./PerformerMerge";
import PerformerDelete from "./PerformerDelete";

const PerformerRoutes: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_PERFORMERS}>
      <Performers />
    </Route>
    <Route exact path={ROUTE_PERFORMER_ADD}>
      <PerformerAdd />
    </Route>
    <Route exact path={ROUTE_PERFORMER}>
      <Performer />
    </Route>
    <Route exact path={ROUTE_PERFORMER_EDIT}>
      <PerformerEdit />
    </Route>
    <Route exact path={ROUTE_PERFORMER_MERGE}>
      <PerformerMerge />
    </Route>
    <Route exact path={ROUTE_PERFORMER_DELETE}>
      <PerformerDelete />
    </Route>
  </Switch>
);

export default PerformerRoutes;
