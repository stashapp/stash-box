import { type FC, useState } from "react";
import { Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { LoadingIndicator } from "src/components/fragments";
import {
  type DraftQuery,
  type GalleryEditDetailsInput,
  OperationEnum,
  useGallery,
  useGalleryEdit,
  useSites,
} from "src/graphql";
import GalleryForm from "src/pages/galleries/galleryForm";
import { editHref } from "src/utils";
import { parseGalleryDraft } from "./parse";

type Draft = NonNullable<DraftQuery["findDraft"]>;
type GalleryDraftData = Draft["data"] & { __typename: "GalleryDraft" };

const GalleryDraft: FC<{
  draft: Omit<Draft, "data"> & { data: GalleryDraftData };
}> = ({ draft }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submit, { loading }] = useGalleryEdit({
    onCompleted: (result) => navigate(editHref(result.galleryEdit)),
    onError: (submissionError) => setError(submissionError.message),
  });
  const { data, loading: loadingSites } = useSites();
  const isUpdate = !!draft.data.id;
  const { data: existing, loading: loadingGallery } = useGallery(
    { id: draft.data.id ?? "" },
    !isUpdate,
  );

  if (loadingSites || loadingGallery) return <LoadingIndicator />;

  const [initial, remainder] = parseGalleryDraft(
    draft.data,
    existing?.findGallery ?? undefined,
    data?.querySites.sites ?? [],
  );
  const unmatched = Object.entries(remainder).filter(([, value]) => !!value);

  const create = (details: GalleryEditDetailsInput, note: string) =>
    submit({
      variables: {
        galleryData: {
          edit: {
            id: draft.data.id,
            operation: isUpdate ? OperationEnum.MODIFY : OperationEnum.CREATE,
            comment: note,
          },
          details: { ...details, draft_id: draft.id },
        },
      },
    });

  return (
    <>
      <h3>Add new gallery from draft</h3>
      {unmatched.length > 0 && (
        <>
          <h6>Unmatched data:</h6>
          <ul>
            {unmatched.map(([key, value]) => (
              <li key={key}>
                <b className="me-2">{key}:</b>
                {String(value)}
              </li>
            ))}
          </ul>
        </>
      )}
      <Row>
        <Col>
          <GalleryForm
            initial={initial}
            callback={create}
            saving={loading}
            isCreate={!isUpdate}
          />
        </Col>
      </Row>
      {error && (
        <div className="text-danger text-end col-9">Error: {error}</div>
      )}
    </>
  );
};

export default GalleryDraft;
