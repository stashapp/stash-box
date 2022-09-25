import React from "react";
import { Route, Switch, useParams } from "react-router-dom";

import { useDraft, DraftQuery } from "src/graphql";
import { ROUTE_DRAFT, ROUTE_DRAFTS } from "src/constants/route";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import Title from "src/components/title";

type DraftData = NonNullable<DraftQuery["findDraft"]>["data"];
type SceneDraft = DraftData & { __typename: "SceneDraft" };
type PerformerDraft = DraftData & { __typename: "PerformerDraft" };

import Draft from "./Draft";
import Drafts from "./Drafts";

const DraftLoader: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useDraft({ id });

  if (loading) return <LoadingIndicator message="Loading draft..." />;

  if (!id) return <ErrorMessage error="Draft ID is missing" />;

  const draft = data?.findDraft;
  if (!draft) return <ErrorMessage error="Draft not found." />;

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

const DraftRoutes: React.FC = () => (
  <Switch>
    <Route exact path={ROUTE_DRAFTS}>
      <>
        <Title page="Drafts" />
        <Drafts />
      </>
    </Route>
    <Route path={ROUTE_DRAFT}>
      <DraftLoader />
    </Route>
  </Switch>
);

export default DraftRoutes;
