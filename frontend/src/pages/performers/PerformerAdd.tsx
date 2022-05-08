import { FC } from "react";
import { useHistory } from "react-router-dom";

import {
  usePerformerEdit,
  OperationEnum,
  PerformerEditDetailsInput,
} from "src/graphql";
import { editHref } from "src/utils";

import PerformerForm from "./performerForm";

const PerformerAdd: FC = () => {
  const history = useHistory();
  const [submitPerformerEdit, { loading: saving }] = usePerformerEdit({
    onCompleted: (data) => {
      if (data.performerEdit.id) history.push(editHref(data.performerEdit));
    },
  });

  const doInsert = (
    updateData: PerformerEditDetailsInput,
    editNote: string
  ) => {
    submitPerformerEdit({
      variables: {
        performerData: {
          edit: {
            operation: OperationEnum.CREATE,
            comment: editNote,
          },
          details: updateData,
        },
      },
    });
  };

  return (
    <div>
      <h3>Add new performer</h3>
      <hr />
      <PerformerForm callback={doInsert} saving={saving} />
    </div>
  );
};

export default PerformerAdd;
