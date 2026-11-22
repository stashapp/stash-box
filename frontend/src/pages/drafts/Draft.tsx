import type { DraftQuery } from "src/graphql";
import GalleryDraft from "./GalleryDraft";
import PerformerDraft from "./PerformerDraft";
import SceneDraft from "./SceneDraft";

type Draft = NonNullable<DraftQuery["findDraft"]>;

const DraftComponent: React.FC<{ draft: Draft }> = ({ draft }) => {
  if (draft.data.__typename === "SceneDraft")
    return <SceneDraft draft={{ ...draft, data: draft.data }} />;
  if (draft.data.__typename === "GalleryDraft")
    return <GalleryDraft draft={{ ...draft, data: draft.data }} />;
  else return <PerformerDraft draft={{ ...draft, data: draft.data }} />;
};

export default DraftComponent;
