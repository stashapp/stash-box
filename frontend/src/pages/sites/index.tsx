import type { FC } from "react";
import { Route, Routes, useParams } from "react-router-dom";

import { useSite } from "src/graphql";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";

import Site from "./Site";
import Sites from "./Sites";
import SiteAdd from "./SiteAdd";
import SiteEdit from "./SiteEdit";

const SiteLoader: FC = () => {
  const { id } = useParams();
  const { data, loading } = useSite({ id: id ?? "" }, !id);

  if (loading) return <LoadingIndicator message="Loading site..." />;

  if (!id) return <ErrorMessage error="Site ID is missing" />;

  const site = data?.findSite;
  if (!site) return <ErrorMessage error="Site not found." />;

  return (
    <Routes>
      <Route
        path="/edit"
        element={
          <>
            <Title page={`Edit Site "${site.name}"`} />
            <SiteEdit site={site} />
          </>
        }
      />
      <Route
        path="/"
        element={
          <>
            <Title page={`Site "${site.name}"`} />
            <Site site={site} />
          </>
        }
      />
    </Routes>
  );
};

const SiteRoutes: FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <>
          <Title page="Sites" />
          <Sites />
        </>
      }
    />
    <Route
      path="/add"
      element={
        <>
          <Title page="Add Site" />
          <SiteAdd />
        </>
      }
    />
    <Route path="/:id/*" element={<SiteLoader />} />
  </Routes>
);

export default SiteRoutes;
