import type { FC } from "react";
import { useParams } from "react-router-dom";

import { useEdit } from "src/graphql";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { AmendmentProvider } from "src/components/amendableEditCard";
import EditAmendForm from "./EditAmendForm";

const EditAmend: FC = () => {
  const { id } = useParams();
  const { data, loading } = useEdit({ id: id ?? "" }, !id);

  if (loading) return <LoadingIndicator message="Loading..." />;

  const edit = data?.findEdit;
  if (!edit) return <ErrorMessage error="Failed to load edit." />;

  if (!edit.closed) {
    return <ErrorMessage error="Only closed edits can be amended." />;
  }

  return (
    <AmendmentProvider>
      <EditAmendForm edit={edit} />
    </AmendmentProvider>
  );
};

export default EditAmend;
