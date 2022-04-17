import { FC, useContext, useState } from "react";
import { useHistory, useParams } from "react-router-dom";

import {
  useEdit,
  useStudioEditUpdate,
  useSceneEditUpdate,
  usePerformerEditUpdate,
  useTagEditUpdate,
  SceneFragment,
  StudioFragment,
  PerformerFragment,
  TagFragment,
  SceneEditDetailsInput,
} from "src/graphql";
import { createHref, isPerformer, isStudio, isTag, isScene, isSceneDetails, parseFuzzyDate } from 'src/utils';
import { ROUTE_EDIT } from "src/constants";
import { Edit_findEdit as Edit } from "src/graphql/definitions/Edit";
import AuthContext from "src/AuthContext";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import SceneForm from "src/pages/scenes/sceneForm";

const SceneUpdate: FC<{ edit: Edit }> = ({ edit }) => {
  const history = useHistory();
  const [submissionError, setSubmissionError] = useState("");
  const [insertSceneEdit, { loading: saving }] = useSceneEditUpdate({
    onCompleted: (result) => {
      if (submissionError) setSubmissionError("");
      if (result.sceneEditUpdate.id)
        history.push(createHref(ROUTE_EDIT, result.sceneEditUpdate));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  if (!isScene(edit.target) || !isSceneDetails(edit.details))
    return null;

  const doUpdate = (updateData: SceneEditDetailsInput, editNote: string) => {
    insertSceneEdit({
      variables: {
        id: edit.id,
        sceneData: {
          edit: {
            id: edit.target?.id,
            operation: edit.operation,
            comment: editNote,
          },
          details: updateData,
        },
      },
    });
  };

  const initial = {
    ...edit.details,
    date: parseFuzzyDate(edit.details.date),
  };

  return (
    <div>
      <h3>
        Edit scene{" "}
        <i>
          <b>{edit.target.title}</b>
        </i>
      </h3>
      <hr />
      <SceneForm scene={edit.target} initial={initial} callback={doUpdate} saving={saving} />
      {submissionError && (
        <div className="text-danger text-end col-9">
          Error: {submissionError}
        </div>
      )}
    </div>
  );
}

const PerformerUpdate: FC<{ edit: Edit, target: PerformerFragment }> = ({ edit, target }) => {
  return <div></div>
}

const StudioUpdate: FC<{ edit: Edit, target: StudioFragment }> = ({ edit, target }) => {
  return <div></div>
}

const TagUpdate: FC<{ edit: Edit, target: TagFragment }> = ({ edit, target }) => {
  return <div></div>
}

const EditComponent: FC = () => {
  const auth = useContext(AuthContext);
  const { id } = useParams<{ id: string }>();
  const { data, loading } = useEdit({ id });

  if (loading) return <LoadingIndicator message="Loading..." />;

  const edit = data?.findEdit;
  if (!edit) return <ErrorMessage error="Failed to load edit." />;
  if (edit.user?.id != auth.user?.id) return <ErrorMessage error="Only the creator can amend edits." />;

  if (isScene(edit.target))
    return <SceneUpdate edit={edit} target={edit.target} />
  if (isPerformer(edit.target))
    return <PerformerUpdate edit={edit} target={edit.target} />
  if (isTag(edit.target))
    return <TagUpdate edit={edit} target={edit.target} />
  if (isStudio(edit.target))
    return <StudioUpdate edit={edit} target={edit.target} />

  return null;
};

export default EditComponent;
