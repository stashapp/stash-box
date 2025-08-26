import type { FC } from "react";
import { Route, Routes, useParams } from "react-router-dom";

import { ErrorMessage, LoadingIndicator } from "src/components/fragments";

import { useStudio } from "src/graphql";
import Title from "src/components/title";

import Studio from "./Studio";
import Studios from "./Studios";
import StudioEdit from "./StudioEdit";
import StudioAdd from "./StudioAdd";
import StudioDelete from "./StudioDelete";

const StudioLoader: FC = () => {
  const { id } = useParams();
  const { loading, data } = useStudio({ id: id ?? "" }, !id);

  if (loading) return <LoadingIndicator message="Loading studio..." />;

  if (!id) return <ErrorMessage error="Studio ID is missing" />;

  const studio = data?.findStudio;
  if (!studio) return <ErrorMessage error="Studio not found." />;

  return (
    <Routes>
      <Route
        path="/delete"
        element={
          <>
            <Title page={`Delete "${studio.name}"`} />
            <StudioDelete studio={studio} />
          </>
        }
      />
      <Route
        path="/edit"
        element={
          <>
            <Title page={`Edit "${studio.name}"`} />
            <StudioEdit studio={studio} />
          </>
        }
      />
      <Route
        path="/"
        element={
          <>
            <Title page={studio.name} />
            <Studio studio={studio} />
          </>
        }
      />
    </Routes>
  );
};

const StudioRoutes: FC = () => (
  <Routes>
    <Route
      path="/add"
      element={
        <>
          <Title page="Add Studio" />
          <StudioAdd />
        </>
      }
    />
    <Route
      path="/"
      element={
        <>
          <Title page="Studios" />
          <Studios />
        </>
      }
    />
    <Route path="/:id/*" element={<StudioLoader />} />
  </Routes>
);

export default StudioRoutes;
