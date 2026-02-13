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

  return (
    <thead>
      <tr>
        {isModerator && (
          <td>
            <b>Select</b>
          </td>
        )}
        <td className="fingerprint-sort-header" onClick={() => onSort("algorithm")}>
          Algorithm
          {renderSortIcon("algorithm")}
        </td>
        <td className="fingerprint-sort-header" onClick={() => onSort("hash")}>
          Hash
          {renderSortIcon("hash")}
        </td>
        <td className="fingerprint-sort-header" onClick={() => onSort("duration")}>
          Duration
          {renderSortIcon("duration")}
        </td>
        <td className="fingerprint-sort-header" onClick={() => onSort("submissions")}>
          Submissions
          {renderSortIcon("submissions")}
        </td>
        <td className="fingerprint-sort-header" onClick={() => onSort("reports")}>
          Reports
          {renderSortIcon("reports")}
        </td>
        <td className="fingerprint-sort-header" onClick={() => onSort("created")}>
          First Added
          {renderSortIcon("created")}
        </td>
        <td className="fingerprint-sort-header" onClick={() => onSort("updated")}>
          Last Added
          {renderSortIcon("updated")}
        </td>
      </tr>
    </thead>
  );
};
