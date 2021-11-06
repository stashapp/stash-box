import { FC } from "react";
import { useHistory } from "react-router-dom";

import { Studio_findStudio as Studio } from "src/graphql/definitions/Studio";
import {
  useStudioEdit,
  StudioEditDetailsInput,
  OperationEnum,
} from "src/graphql";
import { createHref } from "src/utils";
import { ROUTE_EDIT } from "src/constants";
import StudioForm from "./studioForm";

interface Props {
  studio: Studio;
}

const StudioEdit: FC<Props> = ({ studio }) => {
  const history = useHistory();
  const [insertStudioEdit, { loading: saving }] = useStudioEdit({
    onCompleted: (data) => {
      if (data.studioEdit.id)
        history.push(createHref(ROUTE_EDIT, data.studioEdit));
    },
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
    </div>
  );
};

export default StudioEdit;
