import EditCard from "src/components/editCard";
import {
  type EditSortEnum,
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
      <List
        entityName="edits"
        loading={!visible && !error}
        updating={loading && !!visible}
        listCount={visible?.queryEdits.count}
        filters={editFilter}
        page={page}
        setPage={setPage}
        perPage={20}
      >
        <div>
          {visible?.queryEdits.edits.map((edit) => (
            <EditCard edit={edit} key={edit.id} />
          ))}
        </div>
      </List>
    </>
  );
};

export default EditListComponent;
