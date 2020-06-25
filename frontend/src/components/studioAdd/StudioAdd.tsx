import React from "react";
import { useMutation } from "@apollo/react-hooks";
import { useHistory } from "react-router-dom";
import { loader } from "graphql.macro";

import { AddStudioMutation as AddStudio } from "src/definitions/AddStudioMutation";
import { Studio_findStudio as Studio } from "src/definitions/Studio";
import { StudioCreateInput } from "src/definitions/globalTypes";

import StudioForm from "src/components/studioForm";

const AddStudioMutation = loader("src/mutations/AddStudio.gql");

const StudioAdd: React.FC = () => {
  const history = useHistory();
  const [insertStudio] = useMutation<AddStudio>(AddStudioMutation, {
    onCompleted: (data) => {
      if (data.studioCreate?.id)
        history.push(`/studios/${data.studioCreate.id}`);
    },
  });

  const doInsert = (insertData: StudioCreateInput) => {
    insertStudio({ variables: { studioData: insertData } });
  };

  const emptyStudio = {
    id: "",
    name: "",
    urls: [],
    images: [],
  } as Studio;

  return (
    <div>
      <h2>Add new studio</h2>
      <hr />
      <StudioForm studio={emptyStudio} callback={doInsert} />
    </div>
  );
};

export default StudioAdd;
