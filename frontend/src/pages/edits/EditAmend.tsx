import { useParams } from "@tanstack/react-router";
import type { FC } from "react";
import { AmendmentProvider } from "src/components/amendableEditCard";
import { ErrorMessage, LoadingIndicator } from "src/components/fragments";
import { useEdit } from "src/graphql";
import EditAmendForm from "./EditAmendForm";

const EditAmend: FC = () => {
  const { id } = useParams({ strict: false });
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
