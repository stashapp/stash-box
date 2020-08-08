import React, { useState, useContext } from "react";
import { useMutation, useQuery } from "@apollo/react-hooks";
import { Button } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom";
import { loader } from "graphql.macro";

import AuthContext from "src/AuthContext";
import { isAdmin } from "src/utils/auth";
import { LoadingIndicator } from "src/components/fragments";
import EditCard from "src/components/editCard";
import Modal from "src/components/modal";

import { VoteStatusEnum } from "src/definitions/globalTypes";
import { Edit, EditVariables } from "src/definitions/Edit";
import {
  CancelEditMutation,
  CancelEditMutationVariables,
} from "src/definitions/CancelEditMutation";
import {
  ApplyEditMutation,
  ApplyEditMutationVariables,
  ApplyEditMutation_applyEdit_target_Tag as Tag,
} from "src/definitions/ApplyEditMutation";

const EditQuery = loader("src/queries/Edit.gql");
const CancelEdit = loader("src/mutations/CancelEdit.gql");
const ApplyEdit = loader("src/mutations/ApplyEdit.gql");

const EditComponent: React.FC = () => {
  const auth = useContext(AuthContext);
  const { id } = useParams();
  const history = useHistory();
  const [showApply, setShowApply] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const { data, loading } = useQuery<Edit, EditVariables>(EditQuery, {
    variables: { id },
  });
  const [cancelEdit, { loading: cancelling }] = useMutation<
    CancelEditMutation,
    CancelEditMutationVariables
  >(CancelEdit);
  const [applyEdit, { loading: applying }] = useMutation<
    ApplyEditMutation,
    ApplyEditMutationVariables
  >(ApplyEdit);

  if (loading || !data?.findEdit)
    return <LoadingIndicator message="Loading..." />;

  const edit = data.findEdit;

  const toggleCancelModal = () => setShowCancel(true);
  const toggleApplyModal = () => setShowApply(true);

  const handleCancel = (status: boolean): void => {
    if (status) cancelEdit({ variables: { input: { id: edit.id } } });
    setShowCancel(false);
  };
  const handleApply = (status: boolean): void => {
    if (status)
      applyEdit({ variables: { input: { id: edit.id } } }).then((result) => {
        if (edit.target_type === "TAG" && result.data) {
          const target = result.data.applyEdit.target as Tag;
          history.push(`/tags/${target.name}#edits`);
        }
      });
    setShowApply(false);
  };

  const cancelModal = showCancel && (
    <Modal
      message={`Are you sure you want to cancel this edit?`}
      callback={handleCancel}
      acceptTerm="Cancel edit"
    />
  );

  const applyModal = showApply && (
    <Modal
      message={`Are you sure you want to apply this edit?`}
      callback={handleApply}
      acceptTerm="Apply edit"
    />
  );

  const mutating = cancelling || applying;

  const buttons =
    isAdmin(auth.user) && edit.status === VoteStatusEnum.PENDING ? (
      <div className="d-flex justify-content-end">
        <Button
          variant="danger"
          className="mr-2"
          disabled={showCancel || mutating}
          onClick={toggleCancelModal}
        >
          Cancel Edit
        </Button>
        <Button
          variant="danger"
          disabled={showApply || mutating}
          onClick={toggleApplyModal}
        >
          Apply Edit
        </Button>
      </div>
    ) : undefined;

  return (
    <div>
      <EditCard edit={edit} />
      {buttons}
      {cancelModal}
      {applyModal}
    </div>
  );
};

export default EditComponent;
