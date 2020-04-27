import React from "react";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { useHistory, useParams } from "react-router-dom";

import UpdatePerformerMutation from "src/mutations/UpdatePerformer.gql";
import PerformerQuery from "src/queries/Performer.gql";
import { Performer } from "src/definitions/Performer";
import { PerformerUpdateInput } from "src/definitions/globalTypes";

import { LoadingIndicator } from "src/components/fragments";
import PerformerForm from "src/components/performerForm";

const PerformerEdit: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const { loading, data } = useQuery<Performer>(PerformerQuery, {
    variables: { id },
  });
  const [updatePerformer] = useMutation<Performer>(UpdatePerformerMutation, {
    onCompleted: () => {
      history.push(`/performers/${data.findPerformer.id}`);
    },
  });

  const doUpdate = (updateData: PerformerUpdateInput) => {
    updatePerformer({ variables: { performerData: updateData } });
  };

  if (loading) return <LoadingIndicator message="Loading performer..." />;

  return (
    <div>
      <h2>Edit {data.findPerformer.name}</h2>
      <hr />
      <PerformerForm performer={data.findPerformer} callback={doUpdate} />
    </div>
  );
};

export default PerformerEdit;
