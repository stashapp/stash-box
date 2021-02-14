import React from "react";
import { Route, Switch } from "react-router-dom";

import {
  ROUTE_TAG,
  ROUTE_TAGS,
  ROUTE_TAG_ADD,
  ROUTE_TAG_MERGE,
  ROUTE_TAG_EDIT,
} from "src/constants/route";

import Tag from "./Tag";
import Tags from "./Tags";
import TagAdd from "./TagAdd";
import TagEdit from "./TagEdit";
import TagMerge from "./TagMerge";

const SceneRoutes: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_TAGS}>
      <Tags />
    </Route>
    <Route exact path={ROUTE_TAG_ADD}>
      <TagAdd />
    </Route>
    <Route exact path={ROUTE_TAG_MERGE}>
      <TagMerge />
    </Route>
    <Route exact path={ROUTE_TAG_EDIT}>
      <TagEdit />
    </Route>
    <Route exact path={ROUTE_TAG}>
      <Tag />
    </Route>
  </Switch>
);

export default SceneRoutes;
