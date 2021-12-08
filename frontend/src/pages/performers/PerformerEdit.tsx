import { FC, useState } from "react";
import { useHistory } from "react-router-dom";

import { FullPerformer_findPerformer as Performer } from "src/graphql/definitions/FullPerformer";
import {
  usePerformerEdit,
  OperationEnum,
  PerformerEditDetailsInput,
} from "src/graphql";

import { editHref } from "src/utils";
import PerformerForm from "./performerForm";

interface Props {
  performer: Performer;
}

const PerformerModify: FC<Props> = ({ performer }) => {
  const history = useHistory();
  const [submissionError, setSubmissionError] = useState("");
  const [submitPerformerEdit, { loading: saving }] = usePerformerEdit({
    onCompleted: (editData) => {
      if (submissionError) setSubmissionError("");
      if (editData.performerEdit.id)
        history.push(editHref(editData.performerEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  const doUpdate = (
    updateData: PerformerEditDetailsInput,
    editNote: string,
    setModifyAliases: boolean
  ) => {
    submitPerformerEdit({
      variables: {
        performerData: {
          edit: {
            id: performer.id,
            operation: OperationEnum.MODIFY,
            comment: editNote,
          },
          details: updateData,
          options: {
            set_modify_aliases: setModifyAliases,
          },
        },
      },
    });
  };

  return (
    <>
      <h3>
        Edit performer{" "}
        <i>
          <b>{performer.name}</b>
        </i>
      </h3>
      <hr />
      <PerformerForm
        performer={performer}
        callback={doUpdate}
        changeType="modify"
        saving={saving}
      />
      {submissionError && (
        <div className="text-danger text-end col-9">
          Error: {submissionError}
        </div>
      )}
    </>
  );
};

export default PerformerModify;
