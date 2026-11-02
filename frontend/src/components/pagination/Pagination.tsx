import type { FC, MouseEvent } from "react";
import { Pagination, Spinner } from "react-bootstrap";

interface PaginationProps {
  active: number;
  onClick: (page: number) => void;
  count: number;
  perPage: number;
  showCount?: boolean;
  disabled?: boolean;
  updating?: boolean;
}

const PaginationComponent: FC<PaginationProps> = ({
  active,
  perPage,
  onClick,
  count,
  showCount = false,
  disabled = false,
  updating = false,
}) => {
  const pages = Math.ceil(count / perPage);
  const totalPages = pages === 0 ? 1 : pages;
  const showFirst = totalPages > 5 && active > 3;
  const showLast = totalPages > 5 && active < totalPages - 3;

  const maxVal = Math.max(
    Math.min(active + 2, totalPages),
    Math.min(totalPages, 5),
  );
  const minVal = Math.max(maxVal - 4, 1);
  const totalItems = maxVal - minVal + 1;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const paginationItems = [...Array(totalItems)].map((_, arrayIndex) => {
    const index = arrayIndex + minVal;
    const isActive = active === index;
    return (
      <Pagination.Item
        disabled={disabled}
        key={index}
        data-page={index}
        active={isActive}
      >
        {index}
      </Pagination.Item>
    );
  });

  const handleClick = (e: MouseEvent<HTMLUListElement>): void => {
    if (disabled) return;
    const page = (e.target as HTMLElement).closest("a")?.dataset.page;
    if (!page) return;

    const pageNumber = page ? Number.parseInt(page, 10) : 1;
    if (pageNumber !== active) onClick(pageNumber);
  };

  return (
    <div className="ms-auto mt-auto d-flex">
      {showCount && count > 0 && (
        <b className="me-4 mt-2">
          {new Intl.NumberFormat().format(count)} results
        </b>
      )}
      {updating && (
        <Spinner
          animation="border"
          size="sm"
          role="status"
          aria-label="Updating results"
          className="me-2 mt-2"
        />
      )}
      <Pagination onClick={handleClick}>
        {showFirst && <Pagination.First disabled={disabled} data-page={1} />}
        <Pagination.Prev
          disabled={disabled || active === 1}
          data-page={active - 1}
        />
        {paginationItems}
        <Pagination.Next
          disabled={disabled || active === totalPages}
          data-page={active + 1}
        />
        {showLast && (
          <Pagination.Last disabled={disabled} data-page={totalPages} />
        )}
      </Pagination>
    </div>
  );
};

export default PaginationComponent;
