import { FC } from "react";
import { useHistory } from "react-router-dom";

import { Performer_findPerformer as Performer } from "src/graphql/definitions/Performer";
import {
  usePerformerEdit,
  OperationEnum,
  PerformerEditDetailsInput,
} from "src/graphql";
import { editHref } from "src/utils";

import PerformerForm from "./performerForm";

const PerformerAdd: FC = () => {
  const history = useHistory();
  const [submitPerformerEdit, { loading: saving }] = usePerformerEdit({
    onCompleted: (data) => {
      if (data.performerEdit.id) history.push(editHref(data.performerEdit));
    },
  });

  const doInsert = (
    updateData: PerformerEditDetailsInput,
    editNote: string
  ) => {
    submitPerformerEdit({
      variables: {
        performerData: {
          edit: {
            operation: OperationEnum.CREATE,
            comment: editNote,
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
    is_favorite: false,
    __typename: "Performer",
  } as Performer;

  return (
    <div>
      <h3>Add new performer</h3>
      <hr />
      <PerformerForm
        performer={emptyPerformer}
        callback={doInsert}
        saving={saving}
      />
    </div>
  );
};

export default PerformerAdd;
