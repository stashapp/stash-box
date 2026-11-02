import { useReadQuery } from "@apollo/client/react";
import { createRoute, getRouteApi } from "@tanstack/react-router";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import type { DraftQuery } from "src/graphql";
import { DraftDocument } from "src/graphql";
import { narrowRoute } from "src/routing/layouts";
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

const draftsRoute = createRoute({
  getParentRoute: () => narrowRoute,
  path: "drafts",
});

const draftsListRoute = createRoute({
  getParentRoute: () => draftsRoute,
  path: "/",
  component: DraftListPage,
});

const draftsDetailRoute = createRoute({
  getParentRoute: () => draftsRoute,
  path: "$id",
  loader: async ({ context: { client, preloadQuery }, params }) => {
    const variables = { id: params.id };
    const queryRef = preloadQuery(DraftDocument, {
      variables,
      fetchPolicy: "cache-first",
    });
    await preloadQuery.toPromise(queryRef);
    requireEntity(
      client.readQuery({ query: DraftDocument, variables })?.findDraft,
    );
    return { queryRef };
  },
  pendingComponent: () => <PageSkeleton kind="detail" label="Loading draft" />,
  notFoundComponent: () => <ErrorMessage error="Draft not found." />,
  component: DraftDetailPage,
});

export const draftRoutes = draftsRoute.addChildren([
  draftsListRoute,
  draftsDetailRoute,
]);
