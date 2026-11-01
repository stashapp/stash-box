import { type QueryRef, useReadQuery } from "@apollo/client/react";
import { EditListView } from "src/components/list/EditList";
import type { EditQueryInput, EditsQuery } from "src/graphql";
import { usePagination } from "src/hooks";
import Edit from "./Edit";
import EditAmend from "./EditAmend";
import EditUpdate from "./EditUpdate";

export function EditListPage({
  queryRef,
  input,
  updating,
}: {
  queryRef: QueryRef<EditsQuery>;
  input: EditQueryInput;
  updating: boolean;
}) {
  const { data } = useReadQuery(queryRef);
  const { setPage } = usePagination();
  return (
    <EditListView
      data={data}
      page={input.page ?? 1}
      setPage={setPage}
      updating={updating}
    />
  );
}

export const EditUpdatePage = () => <EditUpdate />;

export const EditAmendPage = () => <EditAmend />;

export const EditDetailPage = () => <Edit />;

export default EditListPage;
