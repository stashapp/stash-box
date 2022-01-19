import { Draft_findDraft as Draft } from "src/graphql/definitions/Draft";
import SceneDraft from "./SceneDraft";
import PerformerDraft from "./PerformerDraft";

const DraftComponent: React.FC<{ draft: Draft }> = ({ draft }) => {
  if (draft.data.__typename === "SceneDraft")
    return <SceneDraft draft={{ ...draft, data: draft.data }} />;
  else return <PerformerDraft draft={{ ...draft, data: draft.data }} />;
};

export default DraftComponent;
