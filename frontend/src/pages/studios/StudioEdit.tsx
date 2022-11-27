import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useStudioEdit,
  StudioEditDetailsInput,
  OperationEnum,
  StudioFragment as Studio,
} from "src/graphql";
import { createHref } from "src/utils";
import { ROUTE_EDIT } from "src/constants";
import StudioForm from "./studioForm";

interface Props {
  studio: Studio;
}

const StudioEdit: FC<Props> = ({ studio }) => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [insertStudioEdit, { loading: saving }] = useStudioEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.studioEdit.id) navigate(createHref(ROUTE_EDIT, data.studioEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  const doUpdate = (insertData: StudioEditDetailsInput, editNote: string) => {
    insertStudioEdit({
      variables: {
        studioData: {
          edit: {
            id: studio.id,
            operation: OperationEnum.MODIFY,
            comment: editNote,
          },
          details: insertData,
        },
      },
    });
  };

  return (
    <div>
      <h3>
        Edit
        <strong className="ms-2">{studio.name}</strong>
      </h3>
      <hr />
      <StudioForm
        studio={studio}
        callback={doUpdate}
        showNetworkSelect={studio.child_studios.length === 0}
        saving={saving}
      />
      {submissionError && (
        <div className="text-danger text-end col-9">
          Error: {submissionError}
        </div>
      )}
    </div>
  );
};

export default StudioEdit;
