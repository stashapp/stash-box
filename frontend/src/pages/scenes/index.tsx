import type { FC } from "react";
import { Route, Routes, useParams } from "react-router-dom";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";

import { useScene } from "src/graphql";
import Title from "src/components/title";

import Scenes from "./Scenes";
import Scene from "./Scene";
import SceneEdit from "./SceneEdit";
import SceneAdd from "./SceneAdd";
import SceneDelete from "./SceneDelete";

const SceneLoader: FC = () => {
  const { id } = useParams();
  const { loading, data } = useScene({ id: id ?? "id" }, !id);

  if (loading) return <LoadingIndicator message="Loading scene..." />;

  if (!id) return <ErrorMessage error="Scene ID is missing" />;

  const scene = data?.findScene;
  if (!scene) return <ErrorMessage error="Scene not found." />;

  return (
    <Routes>
      <Route
        path="/delete"
        element={
          <>
            <Title page={`Delete Scene "${scene.title}"`} />
            <SceneDelete scene={scene} />
          </>
        }
      />
      <Route
        path="/edit"
        element={
          <>
            <Title page={`Edit Scene "${scene.title}"`} />
            <SceneEdit scene={scene} />
          </>
        }
      />
      <Route
        path="/"
        element={
          <>
            <Title page={`"${scene.title}"`} />
            <Scene scene={scene} />
          </>
        }
      />
    </Routes>
  );
};

const SceneRoutes: FC = () => (
  <Routes>
    <Route
      path="/add"
      element={
        <>
          <Title page="Add Scene" />
          <SceneAdd />
        </>
      }
    />
    <Route
      path="/"
      element={
        <>
          <Title page="Scenes" />
          <Scenes />
        </>
      }
    />
    <Route path="/:id/*" element={<SceneLoader />} />
  </Routes>
);

export default SceneRoutes;
