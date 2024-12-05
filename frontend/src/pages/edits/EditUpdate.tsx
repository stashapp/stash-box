import { FC } from "react";
import { useParams } from "react-router-dom";

import { useEditUpdate, TargetTypeEnum } from "src/graphql";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { SceneEditUpdate } from "src/pages/scenes/SceneEditUpdate";
import { PerformerEditUpdate } from "src/pages/performers/PerformerEditUpdate";
import { TagEditUpdate } from "src/pages/tags/TagEditUpdate";
import { StudioEditUpdate } from "src/pages/studios/StudioEditUpdate";

const EditUpdateComponent: FC = () => {
  const { id } = useParams();
  const { data, loading } = useEditUpdate({ id: id ?? "" }, !id);

  if (loading) return <LoadingIndicator message="Loading..." />;

  const edit = data?.findEdit;
  if (!edit) return <ErrorMessage error="Failed to load edit." />;
  if (!edit.updatable) return <ErrorMessage error="Unable to update edit" />;

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
