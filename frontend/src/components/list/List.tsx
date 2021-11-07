import { FC, ReactNode, useEffect, useState } from "react";
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
}) => {
  const [count, setCount] = useState(listCount ?? 0);

  useEffect(() => {
    if (!loading && listCount !== undefined) setCount(listCount);
  }, [loading, listCount]);

  return (
    <>
      <div className="d-flex mt-2 align-items-start">
        {filters}
        <Pagination
          onClick={setPage}
          count={count}
          active={page}
          perPage={perPage}
          showCount
        />
      </div>
      {loading ? (
        <LoadingIndicator message={`Loading ${entityName}...`} />
      ) : count > 0 ? (
        children
      ) : (
        <h4 className="m-4 p-4 text-center">No results</h4>
      )}
      <div className="d-flex">
        <Pagination
          onClick={setPage}
          count={count}
          perPage={perPage}
          active={page}
        />
      </div>
    </>
  );
};

export default List;
