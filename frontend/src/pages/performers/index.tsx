import { type QueryRef, useReadQuery } from "@apollo/client/react";
import { Outlet } from "@tanstack/react-router";
import type { FC } from "react";
import { createContext, useContext } from "react";

import Title from "src/components/title";
import type { FullPerformerQuery } from "src/graphql";
import { requireEntity } from "src/routing/requireEntity";
import Performer from "./Performer";
import PerformerAdd from "./PerformerAdd";
import PerformerDelete from "./PerformerDelete";
import PerformerEdit from "./PerformerEdit";
import PerformerMerge from "./PerformerMerge";
import Performers from "./Performers";

const PerformerContext = createContext<NonNullable<
  FullPerformerQuery["findPerformer"]
> | null>(null);
export const PerformerLayout = ({
  queryRef,
}: {
  queryRef: QueryRef<FullPerformerQuery>;
}) => {
  const { data } = useReadQuery(queryRef);
  const performer = requireEntity(data.findPerformer);
  return (
    <PerformerContext.Provider value={performer}>
      <Outlet />
    </PerformerContext.Provider>
  );
};

export const PerformerMergePage: FC = () => {
  const value = useContext(PerformerContext);
  if (!value) throw new Error("Performer layout is missing");
  const performer = value;
  return (
    <>
      <Title page={`Merge Into "${performer.name}"`} />
      <PerformerMerge performer={performer} />
    </>
  );
};

export const PerformerDeletePage: FC = () => {
  const value = useContext(PerformerContext);
  if (!value) throw new Error("Performer layout is missing");
  const performer = value;
  return (
    <>
      <Title page={`Delete "${performer.name}"`} />
      <PerformerDelete performer={performer} />
    </>
  );
};

export const PerformerEditPage: FC = () => {
  const value = useContext(PerformerContext);
  if (!value) throw new Error("Performer layout is missing");
  const performer = value;
  return (
    <>
      <Title page={`Edit "${performer.name}"`} />
      <PerformerEdit performer={performer} />
    </>
  );
};

export const PerformerDetailPage: FC = () => {
  const value = useContext(PerformerContext);
  if (!value) throw new Error("Performer layout is missing");
  const performer = value;
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

export default PerformerLayout;
