import React from "react";
import { useMutation } from "@apollo/react-hooks";
import { useHistory } from "react-router-dom";

import { Performer_findPerformer as Performer } from "src/definitions/Performer";
import {
  AddPerformerMutation,
  AddPerformerMutationVariables,
} from "src/definitions/AddPerformerMutation";
import AddPerformer from "src/mutations/AddPerformer.gql";
import {
  PerformerUpdateInput,
  PerformerCreateInput,
} from "src/definitions/globalTypes";

import PerformerForm from "src/components/performerForm";

const PerformerAdd: React.FC = () => {
  const history = useHistory();
  const [insertPerformer] = useMutation<
    AddPerformerMutation,
    AddPerformerMutationVariables
  >(AddPerformer, {
    onCompleted: (data) => {
      history.push(`/performers/${data.performerCreate.id}`);
    },
  });

  const doInsert = (updateData: PerformerUpdateInput) => {
    const { id, ...performerData } = updateData;
    const insertData: PerformerCreateInput = {
      ...performerData,
      name: updateData.name,
    };
    insertPerformer({ variables: { performerData: insertData } });
  };

  const emptyPerformer = {
    name: null,
    disambiguation: null,
    gender: null,
    birthdate: null,
    career_start_year: null,
    career_end_year: null,
    height: null,
    measurements: null,
    country: null,
    ethnicity: null,
    eye_color: null,
    hair_color: null,
    tattoos: null,
    piercings: null,
    aliases: null,
  } as Performer;

  return (
    <div>
      <h2>Add new performer</h2>
      <hr />
      <PerformerForm performer={emptyPerformer} callback={doInsert} />
    </div>
  );
};

export default PerformerAdd;
