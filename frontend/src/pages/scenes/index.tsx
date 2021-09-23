import React from "react";
import { Route, Switch } from "react-router-dom";

import {
  ROUTE_SCENE,
  ROUTE_SCENE_ADD,
  ROUTE_SCENES,
  ROUTE_SCENE_EDIT,
  ROUTE_SCENE_DELETE,
} from "src/constants/route";

import Scenes from "./Scenes";
import Scene from "./Scene";
import SceneEdit from "./SceneEdit";
import SceneAdd from "./SceneAdd";
import SceneDelete from "./SceneDelete";

const SceneRoutes: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_SCENE_ADD}>
      <SceneAdd />
    </Route>
    <Route exact path={ROUTE_SCENE}>
      <Scene />
    </Route>
    <Route exact path={ROUTE_SCENES}>
      <Scenes />
    </Route>
    <Route exact path={ROUTE_SCENE_EDIT}>
      <SceneEdit />
    </Route>
    <Route exact path={ROUTE_SCENE_DELETE}>
      <SceneDelete />
    </Route>
  </Switch>
);

export default SceneRoutes;
