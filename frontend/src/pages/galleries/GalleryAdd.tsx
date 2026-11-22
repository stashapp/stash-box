import { type FC, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  type GalleryEditDetailsInput,
  OperationEnum,
  useGalleryEdit,
} from "src/graphql";
import { editHref } from "src/utils";
import GalleryForm from "./galleryForm";

const GalleryAdd: FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submit, { loading }] = useGalleryEdit({
    onCompleted: (data) => navigate(editHref(data.galleryEdit)),
    onError: (submissionError) => setError(submissionError.message),
  });

  const create = (details: GalleryEditDetailsInput, note: string) =>
    submit({
      variables: {
        galleryData: {
          edit: { operation: OperationEnum.CREATE, comment: note },
          details,
        },
      },
    });

  return (
    <>
      <h3>Add new gallery</h3>
      <hr />
      <GalleryForm callback={create} saving={loading} isCreate />
      {error && (
        <div className="text-danger text-end col-9">Error: {error}</div>
      )}
    </>
  );
};

export default GalleryAdd;
