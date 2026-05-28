import {
  faSort,
  faSortDown,
  faSortUp,
} from "@fortawesome/free-solid-svg-icons";
import { type FC, useEffect, useRef } from "react";
import { Form } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import type { SortColumn, SortDirection } from "./types";

interface Props {
  isModerator: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  selectedCount: number;
  totalCount: number;
  onSort: (column: SortColumn) => void;
  onToggleAll: () => void;
}

export const FingerprintTableHeader: FC<Props> = ({
  isModerator,
  sortColumn,
  sortDirection,
  selectedCount,
  totalCount,
  onSort,
  onToggleAll,
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const partial = selectedCount > 0 && selectedCount < totalCount;

  useEffect(() => {
    if (checkboxRef.current) checkboxRef.current.indeterminate = partial;
  }, [partial]);

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <Icon icon={faSort} className="ms-1 text-muted" />;
    }
    return (
      <Icon
        icon={sortDirection === "asc" ? faSortUp : faSortDown}
        className="ms-1 text-warning"
      />
    );
  };

  const handleSortKeyDown = (e: React.KeyboardEvent, column: SortColumn) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSort(column);
    }
  };

  return (
    <thead>
      <tr>
        {isModerator && (
          <td>
            <Form.Check
              type="checkbox"
              ref={checkboxRef}
              checked={totalCount > 0 && selectedCount === totalCount}
              onChange={onToggleAll}
              title="Select all"
            />
          </td>
        )}
        <td
          className="fingerprint-sort-header"
          onClick={() => onSort("algorithm")}
          onKeyDown={(e) => handleSortKeyDown(e, "algorithm")}
        >
          Algorithm
          {renderSortIcon("algorithm")}
        </td>
        <td
          className="fingerprint-sort-header"
          onClick={() => onSort("hash")}
          onKeyDown={(e) => handleSortKeyDown(e, "hash")}
        >
          Hash
          {renderSortIcon("hash")}
        </td>
        <td
          className="fingerprint-sort-header"
          onClick={() => onSort("duration")}
          onKeyDown={(e) => handleSortKeyDown(e, "duration")}
        >
          Duration
          {renderSortIcon("duration")}
        </td>
        <td
          className="fingerprint-sort-header"
          onClick={() => onSort("submissions")}
          onKeyDown={(e) => handleSortKeyDown(e, "submissions")}
        >
          Submissions
          {renderSortIcon("submissions")}
        </td>
        <td
          className="fingerprint-sort-header"
          onClick={() => onSort("reports")}
          onKeyDown={(e) => handleSortKeyDown(e, "reports")}
        >
          Reports
          {renderSortIcon("reports")}
        </td>
        <td
          className="fingerprint-sort-header"
          onClick={() => onSort("created")}
          onKeyDown={(e) => handleSortKeyDown(e, "created")}
        >
          First Added
          {renderSortIcon("created")}
        </td>
        <td
          className="fingerprint-sort-header"
          onClick={() => onSort("updated")}
          onKeyDown={(e) => handleSortKeyDown(e, "updated")}
        >
          Last Added
          {renderSortIcon("updated")}
        </td>
      </tr>
    </thead>
  );
};
