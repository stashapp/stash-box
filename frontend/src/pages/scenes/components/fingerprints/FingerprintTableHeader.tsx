import type { FC } from "react";
import {
  faSort,
  faSortUp,
  faSortDown,
} from "@fortawesome/free-solid-svg-icons";
import { Icon } from "src/components/fragments";
import type { SortColumn, SortDirection } from "./types";

interface Props {
  isModerator: boolean;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
}

export const FingerprintTableHeader: FC<Props> = ({
  isModerator,
  sortColumn,
  sortDirection,
  onSort,
}) => {
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <Icon icon={faSort} className="ms-1 text-muted" />;
    }
    return (
      <Icon
        icon={sortDirection === "asc" ? faSortUp : faSortDown}
        className="ms-1"
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
            <b>Select</b>
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
