import type { FC } from "react";
import { Route, Routes, useParams } from "react-router-dom";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";

import { useSiteCategory } from "src/graphql";
import SiteCategories from "./SiteCategories";
import SiteCategory from "./SiteCategory";
import SiteCategoryAdd from "./SiteCategoryAdd";
import SiteCategoryEdit from "./SiteCategoryEdit";

const SiteCategoryLoader: FC = () => {
  const { id } = useParams();
  const { data, loading } = useSiteCategory({ id: id ?? "" }, !id);

  if (!id) return <ErrorMessage error="Site category ID is required" />;
  if (loading) return <LoadingIndicator message="Loading..." />;
  if (!data?.findSiteCategory)
    return <ErrorMessage error="Site category not found" />;

  return (
    <Routes>
      <Route
        path="/edit"
        element={
          <>
            <Title
              page={`Edit Site Category "${data.findSiteCategory.name}"`}
            />
            <SiteCategoryEdit category={data.findSiteCategory} />
          </>
        }
      />
      <Route
        path="/"
        element={
          <>
            <Title page={`Site Category "${data.findSiteCategory.name}"`} />
            <SiteCategory category={data.findSiteCategory} />
          </>
        }
      />
    </Routes>
  );
};

const SiteCategoryRoutes: FC = () => (
  <Routes>
    <Route
      path="/"
      element={
        <>
          <Title page="Site Categories" />
          <SiteCategories />
        </>
      }
    />
    <Route
      path="/add"
      element={
        <>
          <Title page="Add Site Category" />
          <SiteCategoryAdd />
        </>
      }
    />
    <Route path="/:id/*" element={<SiteCategoryLoader />} />
  </Routes>
);

export default SiteCategoryRoutes;
