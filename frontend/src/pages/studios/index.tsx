import { Outlet, useParams } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import type { StudioQuery } from "src/graphql";
import { useStudio } from "src/graphql";

import Studio from "./Studio";
import StudioAdd from "./StudioAdd";
import StudioDelete from "./StudioDelete";
import StudioEdit from "./StudioEdit";
import Studios from "./Studios";

const StudioContext = createContext<NonNullable<
  StudioQuery["findStudio"]
> | null>(null);
export const StudioLayout = () => {
  const { id } = useParams({ strict: false });
  const { data, loading } = useStudio({ id: id ?? "" }, !id);
  if (loading) return <PageSkeleton kind="studio" label="Loading studio" />;
  const studio = data?.findStudio;
  if (!studio) return <ErrorMessage error="Studio not found." />;
  return (
    <StudioContext.Provider value={studio}>
      <Outlet />
    </StudioContext.Provider>
  );
};

export const StudioDeletePage: FC = () => {
  const value = useContext(StudioContext);
  if (!value) throw new Error("Studio layout is missing");
  const studio = value;
  return (
    <>
      <Title page={`Delete "${studio.name}"`} />
      <StudioDelete studio={studio} />
    </>
  );
};

export const StudioEditPage: FC = () => {
  const value = useContext(StudioContext);
  if (!value) throw new Error("Studio layout is missing");
  const studio = value;
  return (
    <>
      <Title page={`Edit "${studio.name}"`} />
      <StudioEdit studio={studio} />
    </>
  );
};

export const StudioDetailPage: FC = () => {
  const value = useContext(StudioContext);
  if (!value) throw new Error("Studio layout is missing");
  const studio = value;
  return (
    <>
      <Title page={studio.name} />
      <Studio studio={studio} />
    </>
  );
};

export const StudioAddPage: FC = () => (
  <>
    <Title page="Add Studio" />
    <StudioAdd />
  </>
);

export const StudioListPage: FC = () => (
  <>
    <Title page="Studios" />
    <Studios />
  </>
);

export default StudioLayout;
