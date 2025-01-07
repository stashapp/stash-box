import { FC, useState } from "react";
import { Button } from "react-bootstrap";
import { useParams, Link } from "react-router-dom";
import { UpdateCount } from "./components/UpdateCount";

import {
  useEdit,
  useCancelEdit,
  useApplyEdit,
  VoteStatusEnum,
  OperationEnum,
} from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import EditCard from "src/components/editCard";
import Modal from "src/components/modal";
import Title from "src/components/title";
import {
  EditOperationTypes,
  EditTargetTypes,
  ROUTE_EDIT_UPDATE,
} from "src/constants";
import {
  getEditTargetRoute,
  getEditTargetName,
  getEditDetailsName,
  createHref,
} from "src/utils";

const EditComponent: FC = () => {
  const { isAdmin, isSelf } = useCurrentUser();
  const { id } = useParams();
  const [showApply, setShowApply] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const { data, loading } = useEdit({ id: id ?? "" }, !id);
  const [cancelEdit, { loading: cancelling }] = useCancelEdit();
  const [applyEdit, { loading: applying }] = useApplyEdit();

  if (loading) return <LoadingIndicator message="Loading..." />;

  const edit = data?.findEdit;
  if (!edit) return <ErrorMessage error="Failed to load edit." />;

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
      acceptTerm="Yes, cancel edit"
      cancelTerm="Cancel"
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

  const buttons = (isAdmin || isSelf(edit.user?.id)) &&
    edit.status === VoteStatusEnum.PENDING && (
      <div className="d-flex justify-content-end">
        <UpdateCount
          updatable={edit.updatable}
          updateCount={edit.update_count}
        />
        {edit.updatable && (
          <Link to={createHref(ROUTE_EDIT_UPDATE, edit)} className="me-2">
            <Button variant="primary" disabled={mutating}>
              Update Edit
            </Button>
          </Link>
        )}
        <Button
          variant="danger"
          className="me-2"
          disabled={showCancel || mutating}
          onClick={toggleCancelModal}
        >
          Cancel Edit
        </Button>
        {isAdmin && (
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

  const targetName =
    edit.operation === OperationEnum.CREATE
      ? getEditDetailsName(edit.details)
      : getEditTargetName(edit.target);

  return (
    <div>
      <Title
        page={`${EditOperationTypes[edit.operation]} ${
          EditTargetTypes[edit.target_type]
        } "${targetName}"`}
      />
      <EditCard edit={edit} showVotes />
      {buttons}
      {cancelModal}
      {applyModal}
    </div>
  );
};

export default EditComponent;
