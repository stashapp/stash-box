import type { FC, ReactNode } from "react";
import {
  CardGridSkeleton,
  ListSkeleton,
} from "src/components/loading/Skeleton";
import Pagination from "src/components/pagination";

const PER_PAGE = 20;

interface Props {
  page: number;
  setPage: (page: number) => void;
  perPage?: number;
  listCount?: number;
  loading: boolean;
  updating?: boolean;
  filters?: ReactNode;
  entityName?: string;
  children?: React.ReactNode;
}

const List: FC<Props> = ({
  page,
  setPage,
  perPage = PER_PAGE,
  listCount,
  loading,
  updating = false,
  filters,
  children,
  entityName = "data",
}) => {
  let content = children;

  if (loading) {
    if (entityName === "scenes" || entityName === "performers") {
      content = (
        <CardGridSkeleton
          label={`Loading ${entityName}`}
          portrait={entityName === "performers"}
        />
      );
    } else {
      content = <ListSkeleton label={`Loading ${entityName}`} />;
    }
  } else if (listCount === 0) {
    content = <h4 className="m-4 p-4 text-center">No results</h4>;
  }

  return (
    <div className={`${entityName}-list`}>
      <div className="d-flex mt-2 align-items-start flex-wrap">
        {filters}
        {listCount !== undefined && (
          <Pagination
            onClick={setPage}
            count={listCount}
            active={page}
            perPage={perPage}
            showCount
            disabled={loading || updating}
            updating={updating}
          />
        )}
      </div>
      <div
        aria-busy={loading || updating}
        className={updating ? "List-updating" : undefined}
      >
        {content}
      </div>
      <div className="d-flex">
        {listCount !== undefined && (
          <Pagination
            onClick={setPage}
            count={listCount}
            perPage={perPage}
            active={page}
            disabled={loading || updating}
            updating={updating}
          />
        )}
      </div>
    </div>
  );
};

export default List;
