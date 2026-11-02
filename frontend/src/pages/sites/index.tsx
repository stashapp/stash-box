import { Outlet, useParams } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import type { SiteQuery } from "src/graphql";
import { useSite } from "src/graphql";

import Site from "./Site";
import SiteAdd from "./SiteAdd";
import SiteEdit from "./SiteEdit";
import Sites from "./Sites";

const SiteContext = createContext<NonNullable<SiteQuery["findSite"]> | null>(
  null,
);
export const SiteLayout = () => {
  const { id } = useParams({ strict: false });
  const { data, loading } = useSite({ id: id ?? "" }, !id);
  if (loading) return <PageSkeleton kind="detail" label="Loading site" />;
  const site = data?.findSite;
  if (!site) return <ErrorMessage error="Site not found." />;
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
