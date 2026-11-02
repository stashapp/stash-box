import { Outlet, useParams } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import type { SiteCategoryQuery } from "src/graphql";
import { useSiteCategory } from "src/graphql";

import SiteCategories from "./SiteCategories";
import SiteCategory from "./SiteCategory";
import SiteCategoryAdd from "./SiteCategoryAdd";
import SiteCategoryEdit from "./SiteCategoryEdit";

const SiteCategoryContext = createContext<NonNullable<
  SiteCategoryQuery["findSiteCategory"]
> | null>(null);
export const SiteCategoryLayout = () => {
  const { id } = useParams({ strict: false });
  const { data, loading } = useSiteCategory({ id: Number(id) }, !id);
  if (loading)
    return <PageSkeleton kind="detail" label="Loading sitecategory" />;
  const category = data?.findSiteCategory;
  if (!category) return <ErrorMessage error="SiteCategory not found." />;
  return (
    <SiteCategoryContext.Provider value={category}>
      <Outlet />
    </SiteCategoryContext.Provider>
  );
};

export const SiteCategoryEditPage: FC = () => {
  const value = useContext(SiteCategoryContext);
  if (!value) throw new Error("SiteCategory layout is missing");
  const category = value;
  return (
    <>
      <Title page={`Edit Site Category "${category.name}"`} />
      <SiteCategoryEdit category={category} />
    </>
  );
};

export const SiteCategoryDetailPage: FC = () => {
  const value = useContext(SiteCategoryContext);
  if (!value) throw new Error("SiteCategory layout is missing");
  const category = value;
  return (
    <>
      <Title page={`Site Category "${category.name}"`} />
      <SiteCategory category={category} />
    </>
  );
};

export const SiteCategoryListPage: FC = () => (
  <>
    <Title page="Site Categories" />
    <SiteCategories />
  </>
);

export const SiteCategoryAddPage: FC = () => (
  <>
    <Title page="Add Site Category" />
    <SiteCategoryAdd />
  </>
);

export default SiteCategoryLayout;
