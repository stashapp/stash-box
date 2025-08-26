import type { DraftQuery } from "src/graphql";
import SceneDraft from "./SceneDraft";
import PerformerDraft from "./PerformerDraft";

type Draft = NonNullable<DraftQuery["findDraft"]>;

const DraftComponent: React.FC<{ draft: Draft }> = ({ draft }) => {
  if (draft.data.__typename === "SceneDraft")
    return <SceneDraft draft={{ ...draft, data: draft.data }} />;
  else return <PerformerDraft draft={{ ...draft, data: draft.data }} />;
};

export default DraftComponent;
