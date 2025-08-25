import type { FC } from "react";
import { Route, Routes, useParams } from "react-router-dom";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";

import { useFullPerformer } from "src/graphql";
import Title from "src/components/title";

import Performers from "./Performers";
import Performer from "./Performer";
import PerformerAdd from "./PerformerAdd";
import PerformerEdit from "./PerformerEdit";
import PerformerMerge from "./PerformerMerge";
import PerformerDelete from "./PerformerDelete";

const PerformerLoader: FC = () => {
  const { id } = useParams();
  const { loading, data } = useFullPerformer({ id: id ?? "" }, !id);

  if (loading) return <LoadingIndicator message="Loading performer..." />;

  if (!id) return <ErrorMessage error="Performer ID is missing" />;

  const performer = data?.findPerformer;
  if (!performer) return <ErrorMessage error="Performer not found." />;

  return (
    <Routes>
      <Route
        path="/merge"
        element={
          <>
            <Title page={`Merge Into "${performer.name}"`} />
            <PerformerMerge performer={performer} />
          </>
        }
      />
      <Route
        path="/delete"
        element={
          <>
            <Title page={`Delete "${performer.name}"`} />
            <PerformerDelete performer={performer} />
          </>
        }
      />
      <Route
        path="/edit"
        element={
          <>
            <Title page={`Edit "${performer.name}"`} />
            <PerformerEdit performer={performer} />
          </>
        }
      />
      <Route
        path="/"
        element={
          <>
            <Title page={performer.name} />
            <Performer performer={performer} />
          </>
        }
      />
    </Routes>
  );
};

const PerformerRoutes: FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <>
          <Title page="Performers" />
          <Performers />
        </>
      }
    />
    <Route
      path="/add"
      element={
        <>
          <Title page="Add Performer" />
          <PerformerAdd />
        </>
      }
    />
    <Route path="/:id/*" element={<PerformerLoader />} />
  </Routes>
);

export default PerformerRoutes;
