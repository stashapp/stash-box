import { type QueryRef, useReadQuery } from "@apollo/client/react";
import { Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";
import Title from "src/components/title";
import type { SiteQuery } from "src/graphql";
import { requireEntity } from "src/routing/requireEntity";

import Site from "./Site";
import SiteAdd from "./SiteAdd";
import SiteEdit from "./SiteEdit";
import Sites from "./Sites";

const SiteContext = createContext<NonNullable<SiteQuery["findSite"]> | null>(
  null,
);
export const SiteLayout = ({ queryRef }: { queryRef: QueryRef<SiteQuery> }) => {
  const { data } = useReadQuery(queryRef);
  const site = requireEntity(data.findSite);
  return (
    <SiteContext.Provider value={site}>
      <Outlet />
    </SiteContext.Provider>
  );
};

export const SiteEditPage: FC = () => {
  const value = useContext(SiteContext);
  if (!value) throw new Error("Site layout is missing");
  const site = value;
  return (
    <>
      <Title page={`Edit Site "${site.name}"`} />
      <SiteEdit site={site} />
    </>
  );
};

export const SiteDetailPage: FC = () => {
  const value = useContext(SiteContext);
  if (!value) throw new Error("Site layout is missing");
  const site = value;
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

export default SiteLayout;
