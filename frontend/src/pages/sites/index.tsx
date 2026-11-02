import { useReadQuery } from "@apollo/client/react";
import { useLoaderData } from "@tanstack/react-router";
import type { FC } from "react";
import Title from "src/components/title";
import { requireEntity } from "src/routing/requireEntity";

import Site from "./Site";
import SiteAdd from "./SiteAdd";
import SiteEdit from "./SiteEdit";
import Sites from "./Sites";

interface SitePageProps {
  from: "/narrow/sites/$id" | "/narrow/admin/sites/$id";
}

export const SiteEditPage: FC<SitePageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery(queryRef);
  const site = requireEntity(data.findSite);

  return (
    <>
      <Title page={`Edit Site "${site.name}"`} />
      <SiteEdit site={site} />
    </>
  );
};

export const SiteDetailPage: FC<SitePageProps> = ({ from }) => {
  const { queryRef } = useLoaderData({ from });
  const { data } = useReadQuery(queryRef);
  const site = requireEntity(data.findSite);

  return (
    <>
      <Title page={`Site "${site.name}"`} />
      <Site site={site} />
    </>
  );
};

export const SiteListPage: FC = () => (
  <>
    <Title page="Sites" />
    <Sites />
  </>
);

export const SiteAddPage: FC = () => (
  <>
    <Title page="Add Site" />
    <SiteAdd />
  </>
);

export default SiteDetailPage;
