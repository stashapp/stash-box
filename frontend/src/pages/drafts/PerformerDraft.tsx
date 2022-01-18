import { FC } from "react";
import { useHistory } from "react-router-dom";

import {
  Draft_findDraft as Draft,
  Draft_findDraft_data_PerformerDraft as PerformerDraft,
} from "src/graphql/definitions/Draft";
import { Performer_findPerformer as Performer } from "src/graphql/definitions/Performer";
import {
  usePerformerEdit,
  OperationEnum,
  PerformerEditDetailsInput,
} from "src/graphql";
import { editHref } from "src/utils";
import { parsePerformerDraft } from "./parse";

import PerformerForm from "src/pages/performers/performerForm";

interface Props {
  draft: Omit<Draft, "data"> & { data: PerformerDraft };
}

const AddPerformerDraft: FC<Props> = ({ draft }) => {
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

  const [initialPerformer, unparsed] = parsePerformerDraft(draft.data);
  const remainder = Object.entries(unparsed)
    .filter(([, val]) => !!val)
    .map(([key, val]) => (
      <li key={key}>
        <b className="me-2">{key}:</b>
        <span>{val}</span>
      </li>
    ));

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
      <h3>Add new performer draft</h3>
      <hr />
      {remainder.length > 0 && (
        <>
          <h6>Unmatched data:</h6>
          <ul>{remainder}</ul>
          <hr />
        </>
      )}
      <PerformerForm
        performer={emptyPerformer}
        callback={doInsert}
        changeType="create"
        saving={saving}
        initial={initialPerformer}
      />
    </div>
  );
};

export default AddPerformerDraft;
