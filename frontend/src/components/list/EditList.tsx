import type { ReactNode } from "react";
import EditCard from "src/components/editCard";
import {
  type EditSortEnum,
  type EditsQuery,
  type OperationEnum,
  type SortDirectionEnum,
  type TargetTypeEnum,
  type UserVotedFilterEnum,
  useEdits,
  type VoteStatusEnum,
} from "src/graphql";
import { useEditFilter, usePagination } from "src/hooks";
import { editListInput } from "src/utils/listFilters";
import List from "./List";
import { QueryError } from "./QueryError";

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
  defaultBot?: "include" | "exclude" | "only";
  showVotedFilter?: boolean;
  userSubmitted?: boolean;
  defaultUserSubmitted?: boolean;
}

export function EditListView({
  data,
  filters,
  page,
  setPage,
  loading = false,
  updating = false,
}: {
  data?: EditsQuery;
  filters?: ReactNode;
  page: number;
  setPage: (page: number) => void;
  loading?: boolean;
  updating?: boolean;
}) {
  return (
    <List
      entityName="edits"
      loading={loading}
      updating={updating}
      listCount={data?.queryEdits.count}
      filters={filters}
      page={page}
      setPage={setPage}
      perPage={20}
    >
      <div>
        {data?.queryEdits.edits.map((edit) => (
          <EditCard edit={edit} key={edit.id} />
        ))}
      </div>
    </List>
  );
}

const EditListComponent = ({ id, userId, ...options }: EditsProps) => {
  const { page: requestedPage, setPage } = usePagination();
  const { editFilter, ...filters } = useEditFilter({
    ...options,
    showFavoriteOption: id === undefined,
  });
  const input = editListInput(filters, { page: requestedPage, id, userId });
  const page = input.page ?? 1;
  const { data, previousData, loading, error, refetch } = useEdits({ input });
  const visible = data ?? previousData;
  return (
    <>
      <QueryError
        error={error}
        retry={() => refetch()}
        retrying={loading}
        showingPrevious={!!visible}
      />
      <EditListView
        data={visible}
        filters={editFilter}
        page={page}
        setPage={setPage}
        loading={!visible && !error}
        updating={loading && !!visible}
      />
    </>
  );
};

export default EditListComponent;
