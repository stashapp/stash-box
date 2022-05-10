import { FC } from "react";
import { useHistory } from "react-router-dom";

import {
  useStudioEdit,
  OperationEnum,
  StudioEditDetailsInput,
} from "src/graphql";
import { editHref } from "src/utils";

import StudioForm from "./studioForm";

const StudioAdd: FC = () => {
  const history = useHistory();
  const [insertStudioEdit, { loading: saving }] = useStudioEdit({
    onCompleted: (data) => {
      if (data.studioEdit.id) history.push(editHref(data.studioEdit));
    },
  });

  const doInsert = (insertData: StudioEditDetailsInput, editNote: string) => {
    insertStudioEdit({
      variables: {
        studioData: {
          edit: {
            operation: OperationEnum.CREATE,
            comment: editNote,
          },
          details: insertData,
        },
      },
    });
  };

  return (
    <div>
      <h3>Add new studio</h3>
      <hr />
      <StudioForm callback={doInsert} saving={saving} />
    </div>
  );
};

export default StudioAdd;
