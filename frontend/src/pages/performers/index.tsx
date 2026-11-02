import { useReadQuery } from "@apollo/client/react";
import { getRouteApi } from "@tanstack/react-router";
import type { FC } from "react";
import Title from "src/components/title";
import { requireEntity } from "src/routing/requireEntity";

import Performer from "./Performer";
import PerformerAdd from "./PerformerAdd";
import PerformerDelete from "./PerformerDelete";
import PerformerEdit from "./PerformerEdit";
import PerformerMerge from "./PerformerMerge";
import Performers from "./Performers";

const routeApi = getRouteApi("/narrow/performers/$id");

export const PerformerMergePage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const performer = requireEntity(data.findPerformer);

  return (
    <>
      <Title page={`Merge Into "${performer.name}"`} />
      <PerformerMerge performer={performer} />
    </>
  );
};

export const PerformerDeletePage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const performer = requireEntity(data.findPerformer);

  return (
    <>
      <Title page={`Delete "${performer.name}"`} />
      <PerformerDelete performer={performer} />
    </>
  );
};

export const PerformerEditPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const performer = requireEntity(data.findPerformer);

  return (
    <>
      <Title page={`Edit "${performer.name}"`} />
      <PerformerEdit performer={performer} />
    </>
  );
};

export const PerformerDetailPage: FC = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const performer = requireEntity(data.findPerformer);

  return (
    <>
      <Title page={performer.name} />
      <Performer performer={performer} />
    </>
  );
};

export const PerformerListPage: FC = () => (
  <>
    <Title page="Performers" />
    <Performers />
  </>
);

export const PerformerAddPage: FC = () => (
  <>
    <Title page="Add Performer" />
    <PerformerAdd />
  </>
);

export default PerformerDetailPage;
