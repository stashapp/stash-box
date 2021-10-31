import React from "react";
import { Route, Switch, useParams } from "react-router-dom";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";

import { useScene } from "src/graphql";
import Title from "src/components/title";
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

const SceneLoader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { loading, data } = useScene({ id });

  if (loading) return <LoadingIndicator message="Loading scene..." />;

  if (!id) return <ErrorMessage error="Scene ID is missing" />;

  const scene = data?.findScene;
  if (!scene) return <ErrorMessage error="Scene not found." />;

  return (
    <Switch>
      <Route exact path={ROUTE_SCENE_DELETE}>
        <>
          <Title page={`Delete Scene "${scene.title}"`} />
          <SceneDelete scene={scene} />
        </>
      </Route>
      <Route exact path={ROUTE_SCENE_EDIT}>
        <>
          <Title page={`Edit Scene "${scene.title}"`} />
          <SceneEdit scene={scene} />
        </>
      </Route>
      <Route exact path={ROUTE_SCENE}>
        <>
          <Title page={`"${scene.title}"`} />
          <Scene scene={scene} />
        </>
      </Route>
    </Switch>
  );
};

const SceneRoutes: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_SCENE_ADD}>
      <>
        <Title page="Add Scene" />
        <SceneAdd />
      </>
    </Route>
    <Route exact path={ROUTE_SCENES}>
      <>
        <Title page="Scenes" />
        <Scenes />
      </>
    </Route>
    <Route path={ROUTE_SCENE}>
      <SceneLoader />
    </Route>
  </Switch>
);

export default SceneRoutes;
