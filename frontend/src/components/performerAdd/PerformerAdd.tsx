import React from "react";
import { useMutation } from "@apollo/client";
import { useHistory } from "react-router-dom";
import { loader } from "graphql.macro";

import { Performer_findPerformer as Performer } from "src/definitions/Performer";
import {
  PerformerEditMutation,
  PerformerEditMutationVariables,
} from "src/definitions/PerformerEditMutation";
import {
  OperationEnum,
  PerformerEditDetailsInput,
} from "src/definitions/globalTypes";

import PerformerForm from "src/components/performerForm";

const PerformerEdit = loader("src/mutations/PerformerEdit.gql");

const PerformerAdd: React.FC = () => {
  const history = useHistory();
  const [submitPerformerEdit] = useMutation<
    PerformerEditMutation,
    PerformerEditMutationVariables
  >(PerformerEdit, {
    onCompleted: (data) => {
      if (data.performerEdit.id)
        history.push(`/edits/${data.performerEdit.id}`);
    },
  });

  const doInsert = (updateData: PerformerEditDetailsInput) => {
    submitPerformerEdit({
      variables: {
        performerData: {
          edit: {
            operation: OperationEnum.CREATE,
          },
          details: updateData,
        },
      },
    });
  };

  const emptyPerformer = {
    id: "",
    age: null,
    name: "",
    breast_type: null,
    disambiguation: null,
    gender: null,
    birthdate: null,
    career_start_year: null,
    career_end_year: null,
    height: null,
    measurements: {
      waist: null,
      hip: null,
      band_size: null,
      cup_size: null,
      __typename: "Measurements",
    },
    country: null,
    ethnicity: null,
    eye_color: null,
    hair_color: null,
    tattoos: null,
    piercings: null,
    aliases: [],
    urls: [],
    images: [],
    deleted: false,
    __typename: "Performer",
  } as Performer;

  return (
    <div>
      <h2>Add new performer</h2>
      <hr />
      <PerformerForm
        performer={emptyPerformer}
        callback={doInsert}
        changeType="create"
      />
    </div>
  );
};

export default PerformerAdd;
