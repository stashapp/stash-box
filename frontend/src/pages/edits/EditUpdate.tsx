import type { FC } from "react";
import { useParams } from "react-router-dom";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { TargetTypeEnum, useEditUpdate } from "src/graphql";
import { PerformerEditUpdate } from "src/pages/performers/PerformerEditUpdate";
import { SceneEditUpdate } from "src/pages/scenes/SceneEditUpdate";
import { StudioEditUpdate } from "src/pages/studios/StudioEditUpdate";
import { TagEditUpdate } from "src/pages/tags/TagEditUpdate";

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
