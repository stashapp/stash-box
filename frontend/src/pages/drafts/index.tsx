import { useReadQuery } from "@apollo/client/react";
import { getRouteApi } from "@tanstack/react-router";
import Title from "src/components/title";
import type { DraftQuery } from "src/graphql";
import { requireEntity } from "src/routing/requireEntity";

type DraftData = NonNullable<DraftQuery["findDraft"]>["data"];
type SceneDraft = DraftData & { __typename: "SceneDraft" };
type PerformerDraft = DraftData & { __typename: "PerformerDraft" };

import Draft from "./Draft";
import Drafts from "./Drafts";

const routeApi = getRouteApi("/narrow/drafts/$id");

export const DraftDetailPage = () => {
  const { queryRef } = routeApi.useLoaderData();
  const { data } = useReadQuery(queryRef);
  const draft = requireEntity(data.findDraft);

  return (
    <>
      <Title
        page={`Draft "${
          (draft.data as SceneDraft).title ||
          (draft.data as PerformerDraft).name
        }"`}
      />
      <Draft draft={draft} />
    </>
  );
};

export const DraftListPage = () => (
  <>
    <Title page="Drafts" />
    <Drafts />
  </>
);

export default DraftListPage;
