import { FC, ReactNode } from "react";
import { LoadingIndicator } from "src/components/fragments";
import Pagination from "src/components/pagination";

const PER_PAGE = 20;

interface Props {
  page: number;
  setPage: (page: number) => void;
  perPage?: number;
  listCount?: number;
  loading: boolean;
  filters?: ReactNode;
  entityName?: string;
}

const List: FC<Props> = ({
  page,
  setPage,
  perPage = PER_PAGE,
  listCount,
  loading,
  filters,
  children,
  entityName = "data",
}) => (
  <>
    <div className="d-flex mt-2 align-items-start">
      {filters}
      <Pagination
        onClick={setPage}
        count={listCount ?? 0}
        active={page}
        perPage={perPage}
        showCount
      />
    </div>
    {loading ? (
      <LoadingIndicator message={`Loading ${entityName}...`} />
    ) : listCount && listCount > 0 ? (
      children
    ) : listCount === 0 ? (
      <h4 className="m-4 p-4 text-center">No results</h4>
    ) : (
      <></>
    )}
    <div className="d-flex">
      <Pagination
        onClick={setPage}
        count={listCount ?? 0}
        perPage={perPage}
        active={page}
      />
    </div>
  </>
);

export default List;
