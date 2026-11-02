import { useReadQuery } from "@apollo/client/react";
import { useLoaderData } from "@tanstack/react-router";
import type { FC } from "react";
import Title from "src/components/title";
import { requireEntity } from "src/routing/requireEntity";

import SiteCategories from "./SiteCategories";
import SiteCategory from "./SiteCategory";
import SiteCategoryAdd from "./SiteCategoryAdd";
import SiteCategoryEdit from "./SiteCategoryEdit";

interface SiteCategoryPageProps {
  from: "/narrow/site-categories/$id" | "/narrow/admin/site-categories/$id";
}

export const SiteCategoryEditPage: FC<SiteCategoryPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery(queryRef);
  const category = requireEntity(data.findSiteCategory);

  return (
    <>
      <Title page={`Edit Site Category "${category.name}"`} />
      <SiteCategoryEdit category={category} />
    </>
  );
};

export const SiteCategoryDetailPage: FC<SiteCategoryPageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery(queryRef);
  const category = requireEntity(data.findSiteCategory);

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

export default SiteCategoryDetailPage;
