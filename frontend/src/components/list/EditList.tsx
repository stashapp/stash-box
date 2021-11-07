import { FC } from "react";

import { useEditFilter, usePagination } from "src/hooks";
import {
  useEdits,
  TargetTypeEnum,
  SortDirectionEnum,
  VoteStatusEnum,
  OperationEnum,
} from "src/graphql";
import { ErrorMessage } from "src/components/fragments";
import EditCard from "src/components/editCard";
import List from "./List";

interface EditsProps {
  id?: string;
  sort?: string;
  direction?: SortDirectionEnum;
  type?: TargetTypeEnum;
  status?: VoteStatusEnum;
  operation?: OperationEnum;
  userId?: string;
}

const PER_PAGE = 20;

const EditListComponent: FC<EditsProps> = ({
  id,
  sort,
  direction,
  type,
  status,
  operation,
  userId,
}) => {
  const { page, setPage } = usePagination();
  const {
    editFilter,
    selectedSort,
    selectedDirection,
    selectedType,
    selectedOperation,
    selectedStatus,
  } = useEditFilter({
    sort,
    direction,
    type,
    status,
    operation,
  });
  const { data, loading } = useEdits({
    filter: {
      page,
      per_page: PER_PAGE,
      sort: selectedSort || "created_at",
      direction: selectedDirection,
    },
    editFilter: {
      target_type: selectedType,
      target_id: id,
      status: selectedStatus,
      operation: selectedOperation,
      user_id: userId,
    },
  });

  if (!loading && !data) return <ErrorMessage error="Failed to load edits." />;

  const edits =
    data?.queryEdits?.edits.map((edit) => (
      <EditCard edit={edit} key={edit.id} />
    )) ?? [];

  return (
    <List
      entityName="edits"
      loading={loading}
      listCount={data?.queryEdits.count}
      filters={editFilter}
      page={page}
      setPage={setPage}
    >
      <div>{edits}</div>
    </List>
  );
};

export default EditListComponent;
