import { FC, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  useTagEdit,
  OperationEnum,
  TagEditDetailsInput,
  TagFragment as Tag,
} from "src/graphql";

import { ROUTE_EDIT } from "src/constants/route";
import { createHref } from "src/utils/route";
import TagForm from "./tagForm";

interface Props {
  tag: Tag;
}

const TagEdit: FC<Props> = ({ tag }) => {
  const navigate = useNavigate();
  const [submissionError, setSubmissionError] = useState("");
  const [insertTagEdit, { loading: saving }] = useTagEdit({
    onCompleted: (data) => {
      if (submissionError) setSubmissionError("");
      if (data.tagEdit.id) navigate(createHref(ROUTE_EDIT, data.tagEdit));
    },
    onError: (error) => setSubmissionError(error.message),
  });

  const doUpdate = (insertData: TagEditDetailsInput, editNote: string) => {
    insertTagEdit({
      variables: {
        tagData: {
          edit: {
            id: tag.id,
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
      <h3>Edit tag</h3>
      <hr />
      <TagForm tag={tag} callback={doUpdate} saving={saving} />
      {submissionError && (
        <div className="text-danger col-9">Error: {submissionError}</div>
      )}
    </div>
  );
};

export default TagEdit;
