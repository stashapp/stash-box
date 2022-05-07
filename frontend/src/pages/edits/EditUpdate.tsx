import { FC, useContext } from "react";
import { useParams } from "react-router-dom";

import {
  useEditUpdate,
} from "src/graphql";
import {
  isPerformer,
  isStudio,
  isTag,
  isScene,
} from "src/utils";
import AuthContext from "src/AuthContext";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { SceneEditUpdate } from "src/pages/scenes/SceneEditUpdate";
import { PerformerEditUpdate } from "src/pages/performers/PerformerEditUpdate";
import { TagEditUpdate } from "src/pages/tags/TagEditUpdate";
import { StudioEditUpdate } from "src/pages/studios/StudioEditUpdate";

const EditComponent: FC = () => {
  const auth = useContext(AuthContext);
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useEditUpdate({ id });

  if (loading) return <LoadingIndicator message="Loading..." />;

  const edit = data?.findEdit;
  if (!edit) return <ErrorMessage error="Failed to load edit." />;
  if (edit.user?.id != auth.user?.id)
    return <ErrorMessage error="Only the creator can amend edits." />;
  if (edit.created !== edit.updated)
    return <ErrorMessage error="Edits can only be amended once" />;

  if (isScene(edit.target))
    return <SceneEditUpdate edit={edit} />;
  if (isPerformer(edit.target))
    return <PerformerEditUpdate edit={edit} />;
  if (isTag(edit.target)) return <TagEditUpdate edit={edit} />;
  if (isStudio(edit.target))
    return <StudioEditUpdate edit={edit} />;

  return null;
};

export default EditComponent;
