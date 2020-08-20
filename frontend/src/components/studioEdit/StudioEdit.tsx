import React from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useHistory, useParams } from "react-router-dom";
import { loader } from "graphql.macro";

import { UpdateStudioMutationVariables } from "src/definitions/UpdateStudioMutation";

import { Studio } from "src/definitions/Studio";
import {
  StudioUpdateInput,
  StudioCreateInput,
} from "src/definitions/globalTypes";

import { LoadingIndicator } from "../fragments";
import StudioForm from "../studioForm";

const StudioQuery = loader("src/queries/Studio.gql");
const UpdateStudioMutation = loader("src/mutations/UpdateStudio.gql");

const StudioEdit: React.FC = () => {
  const { id } = useParams();
  const history = useHistory();
  const { loading, data } = useQuery<Studio>(StudioQuery, {
    variables: { id },
  });
  const [updateStudio] = useMutation<Studio, UpdateStudioMutationVariables>(
    UpdateStudioMutation,
    {
      onCompleted: () => {
        if (data?.findStudio?.id)
          history.push(`/studios/${data.findStudio.id}`);
      },
    }
  );

  const doUpdate = (updateData: StudioCreateInput) => {
    if (!id) return;
    const createData: StudioUpdateInput = {
      ...updateData,
      id,
    };
    updateStudio({ variables: { input: createData } });
  };

  if (loading) return <LoadingIndicator message="Loading studio..." />;

  if (!id || !data?.findStudio) return <div>Studio not found!</div>;

  return (
    <div>
      <h2>
        Edit
        <strong className="ml-2">{data.findStudio.name}</strong>
      </h2>
      <hr />
      <StudioForm studio={data.findStudio} callback={doUpdate} />
    </div>
  );
};

export default StudioEdit;
