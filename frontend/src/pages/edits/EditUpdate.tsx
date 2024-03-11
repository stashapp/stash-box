import { FC, useContext } from "react";
import { useParams } from "react-router-dom";

import { useEditUpdate, TargetTypeEnum, OperationEnum } from "src/graphql";
import AuthContext from "src/AuthContext";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { SceneEditUpdate } from "src/pages/scenes/SceneEditUpdate";
import { PerformerEditUpdate } from "src/pages/performers/PerformerEditUpdate";
import { TagEditUpdate } from "src/pages/tags/TagEditUpdate";
import { StudioEditUpdate } from "src/pages/studios/StudioEditUpdate";
import { isAdmin } from "src/utils";

const EditUpdateComponent: FC = () => {
  const auth = useContext(AuthContext);
  const { id } = useParams();
  const { data, loading } = useEditUpdate({ id: id ?? "" }, !id);

  if (loading) return <LoadingIndicator message="Loading..." />;

  const edit = data?.findEdit;
  if (!edit) return <ErrorMessage error="Failed to load edit." />;
  if (edit.user?.id != auth.user?.id && !isAdmin(auth.user))
    return <ErrorMessage error="Only the creator can update edits." />;
  if (edit.updated)
    return <ErrorMessage error="Edits can only be updated once." />;
  if (edit.operation === OperationEnum.DESTROY)
    return <ErrorMessage error="Destroy edits can't be edited." />;

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
