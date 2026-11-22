import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type GalleryFragment as Gallery,
  type GalleryEditDetailsInput,
  OperationEnum,
  useGalleryEdit,
} from "src/graphql";
import { editHref } from "src/utils";
import GalleryForm from "./galleryForm";

const GalleryEdit: FC<{ gallery: Gallery }> = ({ gallery }) => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submit, { loading }] = useGalleryEdit({
    onCompleted: (data) => navigate(editHref(data.galleryEdit)),
    onError: (submissionError) => setError(submissionError.message),
  });

  const update = (details: GalleryEditDetailsInput, note: string) =>
    submit({
      variables: {
        galleryData: {
          edit: {
            id: gallery.id,
            operation: OperationEnum.MODIFY,
            comment: note,
          },
          details,
        },
      },
    });

  return (
    <>
      <h3>
        Edit gallery <b>{gallery.title}</b>
      </h3>
      <hr />
      <GalleryForm gallery={gallery} callback={update} saving={loading} />
      {error && (
        <div className="text-danger text-end col-9">Error: {error}</div>
      )}
    </>
  );
};

export default GalleryEdit;
