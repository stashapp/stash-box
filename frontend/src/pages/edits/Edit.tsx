import React, { useState, useContext } from "react";
import { Button } from "react-bootstrap";
import { useParams } from "react-router-dom";

import {
  useEdit,
  useCancelEdit,
  useApplyEdit,
  VoteStatusEnum,
} from "src/graphql";
import AuthContext from "src/AuthContext";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import EditCard from "src/components/editCard";
import Modal from "src/components/modal";
import Title from "src/components/title";
import { EditOperationTypes } from "src/constants";
import {
  isAdmin,
  getEditTargetRoute,
  getEditTargetName,
  getEditTargetEntity,
} from "src/utils";

const EditComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const { id } = useParams<{ id: string }>();
  const [showApply, setShowApply] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const { data, loading } = useEdit({ id });
  const [cancelEdit, { loading: cancelling }] = useCancelEdit();
  const [applyEdit, { loading: applying }] = useApplyEdit();

  if (loading) return <LoadingIndicator message="Loading..." />;

  const edit = data?.findEdit;
  if (!edit?.id || !edit?.target)
    return <ErrorMessage error="Failed to load edit." />;

  const toggleCancelModal = () => setShowCancel(true);
  const toggleApplyModal = () => setShowApply(true);

  const handleCancel = (status: boolean): void => {
    if (status) cancelEdit({ variables: { input: { id: edit.id } } });
    setShowCancel(false);
  };
  const handleApply = (status: boolean): void => {
    if (status)
      applyEdit({ variables: { input: { id: edit.id } } }).then((result) => {
        const target = result.data?.applyEdit.target;
        if (!target) return;

        window.location.href = `${getEditTargetRoute(target)}#edits`;
      });
    setShowApply(false);
  };

  const cancelModal = showCancel && (
    <Modal
      message="Are you sure you want to cancel this edit?"
      callback={handleCancel}
      acceptTerm="Cancel edit"
    />
  );

  const applyModal = showApply && (
    <Modal
      message="Are you sure you want to apply this edit?"
      callback={handleApply}
      acceptTerm="Apply edit"
    />
  );

  const mutating = cancelling || applying;

  const buttons = (isAdmin(auth.user) || auth.user?.id === edit?.user?.id) &&
    edit.status === VoteStatusEnum.PENDING && (
      <div className="d-flex justify-content-end">
        <Button
          variant="danger"
          className="mr-2"
          disabled={showCancel || mutating}
          onClick={toggleCancelModal}
        >
          Cancel Edit
        </Button>
        {isAdmin(auth.user) && (
          <Button
            variant="danger"
            disabled={showApply || mutating}
            onClick={toggleApplyModal}
          >
            Apply Edit
          </Button>
        )}
      </div>
    );

  return (
    <div>
      <Title
        page={`${EditOperationTypes[edit.operation]} ${getEditTargetEntity(edit.target)} "${getEditTargetName(
          edit.target
        )}"`}
      />
      <EditCard edit={edit} showVotes />
      {buttons}
      {cancelModal}
      {applyModal}
    </div>
  );
};

export default EditComponent;
