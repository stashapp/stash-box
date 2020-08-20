import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useHistory, useParams } from "react-router-dom";
import { loader } from "graphql.macro";

import { Performer } from "src/definitions/Performer";
import { PerformerUpdateInput } from "src/definitions/globalTypes";

import { LoadingIndicator } from "src/components/fragments";
import PerformerForm from "src/components/performerForm";

const UpdatePerformerMutation = loader("src/mutations/UpdatePerformer.gql");
const PerformerQuery = loader("src/queries/Performer.gql");

const PerformerEdit: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const { loading, data } = useQuery<Performer>(PerformerQuery, {
    variables: { id },
  });
  const [updatePerformer] = useMutation<Performer>(UpdatePerformerMutation, {
    onCompleted: () => {
      if (data?.findPerformer?.id)
        history.push(`/performers/${data.findPerformer.id}`);
    },
  });

  const doUpdate = (updateData: PerformerUpdateInput) => {
    updatePerformer({ variables: { performerData: updateData } });
  };

  if (loading) return <LoadingIndicator message="Loading performer..." />;

  if (!data?.findPerformer) return <div>Performer not found!</div>;

  return (
    <div>
      <h2>Edit {data.findPerformer.name}</h2>
      <hr />
      <PerformerForm performer={data.findPerformer} callback={doUpdate} />
    </div>
  );
};

export default PerformerEdit;
