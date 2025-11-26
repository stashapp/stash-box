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
          onClick={() => onSort("algorithm")}
          onKeyDown={(e) => handleSortKeyDown(e, "algorithm")}
          style={{ cursor: "pointer" }}
        >
          <b>
            Algorithm
            {renderSortIcon("algorithm")}
          </b>
        </td>
        <td
          onClick={() => onSort("hash")}
          onKeyDown={(e) => handleSortKeyDown(e, "hash")}
          style={{ cursor: "pointer" }}
        >
          <b>
            Hash
            {renderSortIcon("hash")}
          </b>
        </td>
        <td
          onClick={() => onSort("duration")}
          onKeyDown={(e) => handleSortKeyDown(e, "duration")}
          style={{ cursor: "pointer" }}
        >
          <b>
            Duration
            {renderSortIcon("duration")}
          </b>
        </td>
        <td
          onClick={() => onSort("submissions")}
          onKeyDown={(e) => handleSortKeyDown(e, "submissions")}
          style={{ cursor: "pointer" }}
        >
          <b>
            Submissions
            {renderSortIcon("submissions")}
          </b>
        </td>
        <td
          onClick={() => onSort("reports")}
          onKeyDown={(e) => handleSortKeyDown(e, "reports")}
          style={{ cursor: "pointer" }}
        >
          <b>
            Reports
            {renderSortIcon("reports")}
          </b>
        </td>
        <td
          onClick={() => onSort("created")}
          onKeyDown={(e) => handleSortKeyDown(e, "created")}
          style={{ cursor: "pointer" }}
        >
          <b>
            First Added
            {renderSortIcon("created")}
          </b>
        </td>
        <td
          onClick={() => onSort("updated")}
          onKeyDown={(e) => handleSortKeyDown(e, "updated")}
          style={{ cursor: "pointer" }}
        >
          <b>
            Last Added
            {renderSortIcon("updated")}
          </b>
        </td>
      </tr>
    </thead>
  );
};
