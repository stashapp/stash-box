import { type QueryRef, useReadQuery } from "@apollo/client/react";
import type { FC } from "react";
import Title from "src/components/title";
import type { StudioQuery } from "src/graphql";
import { requireEntity } from "src/routing/requireEntity";

import Studio from "./Studio";
import StudioAdd from "./StudioAdd";
import StudioDelete from "./StudioDelete";
import StudioEdit from "./StudioEdit";
import Studios from "./Studios";

interface StudioPageProps {
  queryRef: QueryRef<StudioQuery>;
}

export const StudioDeletePage: FC<StudioPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const studio = requireEntity(data.findStudio);

  return (
    <>
      <Title page={`Delete "${studio.name}"`} />
      <StudioDelete studio={studio} />
    </>
  );
};

export const StudioEditPage: FC<StudioPageProps> = ({ queryRef }) => {
  const { data } = useReadQuery(queryRef);
  const studio = requireEntity(data.findStudio);

  return (
    <>
      <Title page={`Edit "${studio.name}"`} />
      <StudioEdit studio={studio} />
    </>
  );
};

export const StudioDetailPage: FC<StudioPageProps> = ({ queryRef }) => {
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
