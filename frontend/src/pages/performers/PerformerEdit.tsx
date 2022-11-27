import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  usePerformerEdit,
  OperationEnum,
  PerformerEditDetailsInput,
  FullPerformerQuery,
} from "src/graphql";

import { editHref } from "src/utils";
import PerformerForm from "./performerForm";

type Performer = NonNullable<FullPerformerQuery["findPerformer"]>;

interface Props {
  performer: Performer;
}

const PerformerModify: FC<Props> = ({ performer }) => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [submitPerformerEdit, { loading: saving }] = usePerformerEdit({
    onCompleted: (editData) => {
      if (submissionError) setSubmissionError("");
      if (editData.performerEdit.id) navigate(editHref(editData.performerEdit));
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
