import { type QueryRef, useReadQuery } from "@apollo/client/react";
import type { FC } from "react";
import Title from "src/components/title";
import type { SiteQuery } from "src/graphql";
import { requireEntity } from "src/routing/requireEntity";

import Site from "./Site";
import SiteAdd from "./SiteAdd";
import SiteEdit from "./SiteEdit";
import Sites from "./Sites";

interface SitePageProps {
  queryRef: QueryRef<SiteQuery>;
}

export const SiteEditPage: FC<SitePageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const site = requireEntity(data.findSite);

  return (
    <>
      <Title page={`Edit Site "${site.name}"`} />
      <SiteEdit site={site} />
    </>
  );
};

export const SiteDetailPage: FC<SitePageProps> = ({ queryRef }) => {
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
