import { FC, useContext } from "react";
import { useParams } from "react-router-dom";

import { useEditUpdate, TargetTypeEnum, OperationEnum } from "src/graphql";
import AuthContext from "src/AuthContext";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { SceneEditUpdate } from "src/pages/scenes/SceneEditUpdate";
import { PerformerEditUpdate } from "src/pages/performers/PerformerEditUpdate";
import { TagEditUpdate } from "src/pages/tags/TagEditUpdate";
import { StudioEditUpdate } from "src/pages/studios/StudioEditUpdate";

const EditUpdateComponent: FC = () => {
  const auth = useContext(AuthContext);
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useEditUpdate({ id });

  if (loading) return <LoadingIndicator message="Loading..." />;

  const edit = data?.findEdit;
  if (!edit) return <ErrorMessage error="Failed to load edit." />;
  if (edit.user?.id != auth.user?.id)
    return <ErrorMessage error="Only the creator can amend edits." />;
  if (edit.updated)
    return <ErrorMessage error="Edits can only be amended once" />;
  if (edit.operation === OperationEnum.DESTROY)
    return <ErrorMessage error="Destroy edits can't be edited" />;

  switch (edit.target_type) {
    case TargetTypeEnum.SCENE:
      return <SceneEditUpdate edit={edit} />;
    case TargetTypeEnum.PERFORMER:
      return <PerformerEditUpdate edit={edit} />;
    case TargetTypeEnum.TAG:
      return <TagEditUpdate edit={edit} />;
    case TargetTypeEnum.STUDIO:
      return <StudioEditUpdate edit={edit} />;
  }
};

export default EditUpdateComponent;
