import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useHistory, useParams } from "react-router-dom";
import { loader } from "graphql.macro";

import {
  OperationEnum,
  PerformerEditDetailsInput,
} from "src/definitions/globalTypes";
import { Performer, PerformerVariables } from "src/definitions/Performer";
import {
  PerformerEditMutation,
  PerformerEditMutationVariables,
} from "src/definitions/PerformerEditMutation";

import { LoadingIndicator } from "src/components/fragments";
import PerformerForm from "src/components/performerForm";

const PerformerEdit = loader("src/mutations/PerformerEdit.gql");
const PerformerQuery = loader("src/queries/Performer.gql");

const PerformerModify: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const { loading, data } = useQuery<Performer, PerformerVariables>(
    PerformerQuery,
    {
      variables: { id },
    }
  );
  const [submitPerformerEdit] = useMutation<
    PerformerEditMutation,
    PerformerEditMutationVariables
  >(PerformerEdit, {
    onCompleted: (editData) => {
      if (editData.performerEdit.id)
        history.push(`/edits/${editData.performerEdit.id}`);
    },
  });

  const doUpdate = (updateData: PerformerEditDetailsInput) => {
    submitPerformerEdit({
      variables: {
        performerData: {
          edit: {
            id,
            operation: OperationEnum.MODIFY,
          },
          details: updateData,
        },
      },
    });
  };

  if (loading) return <LoadingIndicator message="Loading performer..." />;
  if (!data?.findPerformer) return <div>Performer not found!</div>;

  return (
    <>
      <h2>
        Edit performer{" "}
        <i>
          <b>{data.findPerformer.name}</b>
        </i>
      </h2>
      <hr />
      <PerformerForm
        performer={data.findPerformer}
        callback={doUpdate}
        changeType="modify"
      />
    </>
  );
};

export default PerformerModify;
