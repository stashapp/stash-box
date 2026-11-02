import { useParams } from "@tanstack/react-router";
import { ErrorMessage } from "src/components/fragments";
import { PageSkeleton } from "src/components/loading/Skeleton";
import Title from "src/components/title";
import type { DraftQuery } from "src/graphql";
import { useDraft } from "src/graphql";

type DraftData = NonNullable<DraftQuery["findDraft"]>["data"];
type SceneDraft = DraftData & { __typename: "SceneDraft" };
type PerformerDraft = DraftData & { __typename: "PerformerDraft" };

import Draft from "./Draft";
import Drafts from "./Drafts";

export const DraftDetailPage = () => {
  const { id } = useParams({ strict: false });
  const { data, loading } = useDraft({ id: id ?? "" }, !id);
  if (loading) return <PageSkeleton kind="detail" label="Loading draft" />;
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

export const DraftListPage = () => (
  <>
    <Title page="Drafts" />
    <Drafts />
  </>
);

export default DraftListPage;
