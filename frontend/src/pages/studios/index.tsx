import { useReadQuery } from "@apollo/client/react";
import { getRouteApi } from "@tanstack/react-router";
import type { FC } from "react";
import Title from "src/components/title";
import { requireEntity } from "src/routing/requireEntity";

import Studio from "./Studio";
import StudioAdd from "./StudioAdd";
import StudioDelete from "./StudioDelete";
import StudioEdit from "./StudioEdit";
import Studios from "./Studios";

const routeApi = getRouteApi("/narrow/studios/$id");

export const StudioDeletePage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const studio = requireEntity(data.findStudio);

  return (
    <>
      <Title page={`Delete "${studio.name}"`} />
      <StudioDelete studio={studio} />
    </>
  );
};

export const StudioEditPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const studio = requireEntity(data.findStudio);

  return (
    <>
      <Title page={`Edit "${studio.name}"`} />
      <StudioEdit studio={studio} />
    </>
  );
};

export const StudioDetailPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const studio = requireEntity(data.findStudio);

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

export default StudioDetailPage;
