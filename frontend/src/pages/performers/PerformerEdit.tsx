import React from "react";
import { useHistory, useParams } from "react-router-dom";

import {
  usePerformer,
  usePerformerEdit,
  OperationEnum,
  PerformerEditDetailsInput,
} from "src/graphql";

import { LoadingIndicator } from "src/components/fragments";
import { editHref } from "src/utils";
import PerformerForm from "./performerForm";

const PerformerModify: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { loading, data } = usePerformer({ id });
  const [submitPerformerEdit, { loading: saving }] = usePerformerEdit({
    onCompleted: (editData) => {
      if (editData.performerEdit.id)
        history.push(editHref(editData.performerEdit));
    },
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
            id,
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

  if (loading) return <LoadingIndicator message="Loading performer..." />;
  if (!data?.findPerformer) return <div>Performer not found!</div>;

  return (
    <>
      <h3>
        Edit performer{" "}
        <i>
          <b>{data.findPerformer.name}</b>
        </i>
      </h3>
      <hr />
      <PerformerForm
        performer={data.findPerformer}
        callback={doUpdate}
        changeType="modify"
        saving={saving}
      />
    </>
  );
};

export default PerformerModify;
