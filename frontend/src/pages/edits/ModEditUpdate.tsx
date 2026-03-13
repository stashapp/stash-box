import { type FC, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Alert, Button } from "react-bootstrap";
import { faWarning } from "@fortawesome/free-solid-svg-icons";

import {
  useEditUpdate,
  useModTagEditUpdate,
  useModPerformerEditUpdate,
  useModStudioEditUpdate,
  useModSceneEditUpdate,
  TargetTypeEnum,
  type TagEditDetailsInput,
  type PerformerEditDetailsInput,
  type StudioEditDetailsInput,
  type SceneEditDetailsInput,
  type EditUpdateQuery,
} from "src/graphql";
import { ErrorMessage, Icon, LoadingIndicator } from "src/components/fragments";
import { useCurrentUser } from "src/hooks";
import {
  createHref,
  isTag,
  isTagEdit,
  isPerformer,
  isPerformerEdit,
  isStudio,
  isStudioEdit,
  isScene,
  isSceneEdit,
} from "src/utils";
import { ROUTE_EDIT } from "src/constants";
import Title from "src/components/title";

import TagForm from "src/pages/tags/tagForm";
import PerformerForm from "src/pages/performers/performerForm";
import StudioForm from "src/pages/studios/studioForm";
import SceneForm from "src/pages/scenes/sceneForm";

type EditData = NonNullable<EditUpdateQuery["findEdit"]>;

interface ModEditFormProps {
  edit: EditData;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const ModTagEditForm: FC<ModEditFormProps> = ({ edit, onSuccess, onError }) => {
  const navigate = useNavigate();
  const [modUpdateEdit, { loading: saving }] = useModTagEditUpdate({
    onCompleted: (result) => {
      onSuccess();
      if (result.modTagEditUpdate.id) {
        navigate(createHref(ROUTE_EDIT, result.modTagEditUpdate));
      }
    },
    onError: (error) => onError(error.message),
  });

  if (!isTagEdit(edit.details) || (edit.target && !isTag(edit.target))) {
    return <ErrorMessage error="Invalid edit type" />;
  }

  const doUpdate = (updateData: TagEditDetailsInput, editNote: string) => {
    modUpdateEdit({
      variables: {
        input: { id: edit.id, reason: editNote },
        details: updateData,
      },
    });
  };

  const tagName = edit.target?.name ?? edit.details.name;

  return (
    <div>
      <Title page={`Amend tag edit for "${tagName}"`} />
      <h3>
        Amend tag edit for
        <i className="ms-2">
          <b>{tagName}</b>
        </i>
      </h3>
      <h5>Amending rewrites the content of a closed edit. The change and edit note will be logged in the audit log.</h5>
      <hr />
      <TagForm
        tag={edit.target}
        initial={edit.details}
        callback={doUpdate}
        saving={saving}
      />
    </div>
  );
};

const ModPerformerEditForm: FC<ModEditFormProps> = ({
  edit,
  onSuccess,
  onError,
}) => {
  const navigate = useNavigate();
  const [modUpdateEdit, { loading: saving }] = useModPerformerEditUpdate({
    onCompleted: (result) => {
      onSuccess();
      if (result.modPerformerEditUpdate.id) {
        navigate(createHref(ROUTE_EDIT, result.modPerformerEditUpdate));
      }
    },
    onError: (error) => onError(error.message),
  });

  if (
    !isPerformerEdit(edit.details) ||
    (edit.target && !isPerformer(edit.target))
  ) {
    return <ErrorMessage error="Invalid edit type" />;
  }

  const doUpdate = (
    updateData: PerformerEditDetailsInput,
    editNote: string,
  ) => {
    modUpdateEdit({
      variables: {
        input: { id: edit.id, reason: editNote },
        details: updateData,
      },
    });
  };

  const performerName = edit.target?.name ?? edit.details.name;

  return (
    <div>
      <Title page={`Amend performer edit for "${performerName}"`} />
      <h3>
        Amend performer edit for
        <i className="ms-2">
          <b>{performerName}</b>
        </i>
      </h3>
      <h5>Amending rewrites the content of a closed edit. The change and edit note will be logged in the audit log.</h5>
      <hr />
      <PerformerForm
        performer={edit.target}
        initial={edit.details}
        callback={doUpdate}
        saving={saving}
      />
    </div>
  );
};

const ModStudioEditForm: FC<ModEditFormProps> = ({
  edit,
  onSuccess,
  onError,
}) => {
  const navigate = useNavigate();
  const [modUpdateEdit, { loading: saving }] = useModStudioEditUpdate({
    onCompleted: (result) => {
      onSuccess();
      if (result.modStudioEditUpdate.id) {
        navigate(createHref(ROUTE_EDIT, result.modStudioEditUpdate));
      }
    },
    onError: (error) => onError(error.message),
  });

  if (!isStudioEdit(edit.details) || (edit.target && !isStudio(edit.target))) {
    return <ErrorMessage error="Invalid edit type" />;
  }

  const doUpdate = (updateData: StudioEditDetailsInput, editNote: string) => {
    modUpdateEdit({
      variables: {
        input: { id: edit.id, reason: editNote },
        details: updateData,
      },
    });
  };

  const studioName = edit.target?.name ?? edit.details.name;

  return (
    <div>
      <Title page={`Amend studio edit for "${studioName}"`} />
      <h3>
        Amend studio edit for
        <i className="ms-2">
          <b>{studioName}</b>
        </i>
      </h3>
      <h6>Amending rewrites the content of a closed edit. The change and edit note will be logged in the audit log.</h6>
      <hr />
      <StudioForm
        studio={edit.target}
        initial={edit.details}
        callback={doUpdate}
        saving={saving}
      />
    </div>
  );
};

const ModSceneEditForm: FC<ModEditFormProps> = ({
  edit,
  onSuccess,
  onError,
}) => {
  const navigate = useNavigate();
  const [modUpdateEdit, { loading: saving }] = useModSceneEditUpdate({
    onCompleted: (result) => {
      onSuccess();
      if (result.modSceneEditUpdate.id) {
        navigate(createHref(ROUTE_EDIT, result.modSceneEditUpdate));
      }
    },
    onError: (error) => onError(error.message),
  });

  if (!isSceneEdit(edit.details) || (edit.target && !isScene(edit.target))) {
    return <ErrorMessage error="Invalid edit type" />;
  }

  const doUpdate = (updateData: SceneEditDetailsInput, editNote: string) => {
    modUpdateEdit({
      variables: {
        input: { id: edit.id, reason: editNote },
        details: updateData,
      },
    });
  };

  const sceneTitle = edit.target?.title ?? edit.details.title;

  return (
    <div>
      <Title page={`Amend scene edit for "${sceneTitle}"`} />
      <h3>
        Amend scene edit for
        <i className="ms-2">
          <b>{sceneTitle}</b>
        </i>
      </h3>
      <Alert variant="warning" style={{ width: "fit-content" }}>
        <Icon icon={faWarning} color="red" className="me-2" />
        Amending rewrites the data of a closed edit. The change and edit note will be logged in the audit log.
      </Alert>
      <hr />
      <SceneForm
        scene={edit.target}
        initial={edit.details}
        callback={doUpdate}
        saving={saving}
      />
    </div>
  );
};

const ModEditUpdateComponent: FC = () => {
  const { isModerator } = useCurrentUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading } = useEditUpdate({ id: id ?? "" }, !id);
  const [submissionError, setSubmissionError] = useState("");

  if (loading) return <LoadingIndicator message="Loading..." />;

  if (!isModerator) {
    return (
      <ErrorMessage error="You must be a moderator to amend closed edits." />
    );
  }

  const edit = data?.findEdit;
  if (!edit) return <ErrorMessage error="Failed to load edit." />;
  if (!edit.closed)
    return (
      <ErrorMessage error="Only closed edits can be amended by moderators." />
    );

  const onSuccess = () => {
    if (submissionError) setSubmissionError("");
  };

  const onError = (error: string) => {
    setSubmissionError(error);
  };

  const formProps: ModEditFormProps = {
    edit,
    onSuccess,
    onError,
  };

  const renderForm = () => {
    switch (edit.target_type) {
      case TargetTypeEnum.TAG:
        return <ModTagEditForm {...formProps} />;
      case TargetTypeEnum.PERFORMER:
        return <ModPerformerEditForm {...formProps} />;
      case TargetTypeEnum.STUDIO:
        return <ModStudioEditForm {...formProps} />;
      case TargetTypeEnum.SCENE:
        return <ModSceneEditForm {...formProps} />;
      default:
        return <ErrorMessage error="Unsupported edit type" />;
    }
  };

  return (
    <div>
      {submissionError && (
        <div className="alert alert-danger mb-3">Error: {submissionError}</div>
      )}
      {renderForm()}
      <div className="d-flex justify-content-end mt-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default ModEditUpdateComponent;
