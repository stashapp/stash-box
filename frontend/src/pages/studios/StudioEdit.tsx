import React from "react";
import { useHistory, useParams } from "react-router-dom";

import {
  useStudio,
  useStudioEdit,
  StudioEditDetailsInput,
  OperationEnum,
} from "src/graphql";
import { LoadingIndicator } from "src/components/fragments";
import { createHref } from "src/utils";
import { ROUTE_EDIT } from "src/constants";
import StudioForm from "./studioForm";

const StudioEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { loading, data: studio } = useStudio({ id });
  const [insertStudioEdit, { loading: saving }] = useStudioEdit({
    onCompleted: (data) => {
      if (data.studioEdit.id)
        history.push(createHref(ROUTE_EDIT, data.studioEdit));
    },
  });

  if (loading) return <LoadingIndicator message="Loading studio..." />;
  if (!id || !studio?.findStudio) return <div>Studio not found!</div>;

  const doUpdate = (insertData: StudioEditDetailsInput, editNote: string) => {
    insertStudioEdit({
      variables: {
        studioData: {
          edit: {
            id: studio.findStudio?.id,
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
        <strong className="ml-2">{studio.findStudio.name}</strong>
      </h3>
      <hr />
      <StudioForm
        studio={studio.findStudio}
        callback={doUpdate}
        showNetworkSelect={studio.findStudio.child_studios.length === 0}
        saving={saving}
      />
    </div>
  );
};

export default StudioEdit;
