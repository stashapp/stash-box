import { FC } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  usePerformer,
  usePerformerEdit,
  OperationEnum,
  PerformerEditDetailsInput,
  DraftQuery,
  useSites,
} from "src/graphql";
import { LoadingIndicator } from "src/components/fragments";
import { editHref, performerHref } from "src/utils";
import { parsePerformerDraft } from "./parse";

type Draft = NonNullable<DraftQuery["findDraft"]>;
type PerformerDraft = Draft["data"] & { __typename: "PerformerDraft" };

import PerformerForm from "src/pages/performers/performerForm";

interface Props {
  draft: Omit<Draft, "data"> & { data: PerformerDraft };
}

const AddPerformerDraft: FC<Props> = ({ draft }) => {
  const isUpdate = Boolean(draft.data.id);
  const navigate = useNavigate();
  const [submitPerformerEdit, { loading: saving }] = usePerformerEdit({
    onCompleted: (data) => {
      if (data.performerEdit.id) navigate(editHref(data.performerEdit));
    },
  });
  const { data: performer, loading: loadingPerformer } = usePerformer(
    { id: draft.data.id ?? "" },
    !isUpdate
  );
  const { data: sitesData, loading: loadingSites } = useSites();

  if (loadingPerformer || loadingSites) return <LoadingIndicator />;

  const doInsert = (
    updateData: PerformerEditDetailsInput,
    editNote: string,
    setModifyAliases: boolean
  ) => {
    const details: PerformerEditDetailsInput = {
      ...updateData,
      draft_id: draft.id,
    };

    submitPerformerEdit({
      variables: {
        performerData: {
          edit: {
            id: draft.data.id,
            operation: isUpdate ? OperationEnum.MODIFY : OperationEnum.CREATE,
            comment: editNote,
          },
          details,
          options: {
            set_modify_aliases: isUpdate ? setModifyAliases : undefined,
          },
        },
      },
    });
  };

  const [initialPerformer, unparsed] = parsePerformerDraft(
    draft.data,
    performer?.findPerformer ?? undefined,
    sitesData?.querySites.sites ?? []
  );
  const remainder = Object.entries(unparsed)
    .filter(([, val]) => !!val)
    .map(([key, val]) => (
      <li key={key}>
        <b className="me-2">{key}:</b>
        <span>{val}</span>
      </li>
    ));

  return (
    <div>
      <h3>{isUpdate ? "Update" : "Add new"} performer from draft</h3>
      {isUpdate && performer?.findPerformer && (
        <h6>
          Performer:{" "}
          <Link to={performerHref(performer.findPerformer)}>
            {performer.findPerformer?.name}
          </Link>
        </h6>
      )}
      <hr />
      {remainder.length > 0 && (
        <>
          <h6>Unmatched data:</h6>
          <ul>{remainder}</ul>
          <hr />
        </>
      )}
      <PerformerForm
        performer={performer?.findPerformer ?? undefined}
        callback={doInsert}
        saving={saving}
        initial={initialPerformer}
      />
    </div>
  );
};

export default AddPerformerDraft;
