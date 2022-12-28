import { FC } from "react";

import { useEditFilter, usePagination } from "src/hooks";
import {
  useEdits,
  TargetTypeEnum,
  SortDirectionEnum,
  VoteStatusEnum,
  OperationEnum,
  EditSortEnum,
  UserVotedFilterEnum,
} from "src/graphql";
import { ErrorMessage } from "src/components/fragments";
import EditCard from "src/components/editCard";
import List from "./List";

interface EditsProps {
  id?: string;
  sort?: EditSortEnum;
  direction?: SortDirectionEnum;
  type?: TargetTypeEnum;
  status?: VoteStatusEnum;
  operation?: OperationEnum;
  voted?: UserVotedFilterEnum;
  userId?: string;
  defaultVoteStatus?: VoteStatusEnum;
  defaultVoted?: UserVotedFilterEnum;
  showVotedFilter?: boolean;
}

const PER_PAGE = 20;

const EditListComponent: FC<EditsProps> = ({
  id,
  sort,
  direction,
  type,
  status,
  operation,
  voted,
  userId,
  defaultVoteStatus,
  defaultVoted,
  showVotedFilter,
}) => {
  const { page, setPage } = usePagination();
  const {
    editFilter,
    selectedSort,
    selectedDirection,
    selectedType,
    selectedOperation,
    selectedVoted,
    selectedStatus,
    selectedFavorite,
    selectedBot,
  } = useEditFilter({
    sort,
    direction,
    type,
    status,
    operation,
    voted,
    showFavoriteOption: id === undefined,
    showVotedFilter,
    defaultVoteStatus,
    defaultVoted,
  });
  const { data, loading } = useEdits({
    input: {
      target_type: selectedType,
      target_id: id,
      status: selectedStatus,
      operation: selectedOperation,
      voted: selectedVoted,
      user_id: userId,
      is_favorite: selectedFavorite,
      is_bot: selectedBot,
      page,
      per_page: PER_PAGE,
      sort: selectedSort,
      direction: selectedDirection,
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
      perPage={PER_PAGE}
    >
      <div>{edits}</div>
    </List>
  );
};

export default EditListComponent;
