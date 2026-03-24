import type { FC } from "react";
import { useState } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import { Icon } from "src/components/fragments";
import { formatDateTime, createHref } from "src/utils";
import { ROUTE_USER } from "src/constants/route";
import DeleteAuditDetails from "./DeleteAuditDetails";
import AmendmentAuditDetails from "./AmendmentAuditDetails";

const actionLabels: Record<string, string> = {
  EDIT_DELETE: "Edit Deleted",
  EDIT_AMENDMENT: "Edit Amended",
};

export interface AuditRowProps {
  audit: {
    id: string;
    action: string;
    user?: { id: string; name: string } | null;
    target_id: string;
    target_type: string;
    data: string;
    reason?: string | null;
    created_at: string;
  };
}

const AuditRow: FC<AuditRowProps> = ({ audit }) => {
  const [expanded, setExpanded] = useState(false);
  const actionLabel = actionLabels[audit.action] ?? audit.action;

  return (
    <>
      <tr>
        <td className="text-nowrap" style={{ width: "40px" }}>
          <Button
            variant="link"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="p-0"
          >
            <Icon icon={expanded ? faChevronDown : faChevronRight} />
          </Button>
        </td>
        <td className="text-nowrap">{formatDateTime(audit.created_at)}</td>
        <td>{actionLabel}</td>
        <td>
          {audit.user ? (
            <Link to={createHref(ROUTE_USER, audit.user)}>
              {audit.user.name}
            </Link>
          ) : (
            <em>Deleted User</em>
          )}
        </td>
        <td>
          {audit.target_type === "EDIT" ? (
            <span>Edit {audit.target_id.slice(0, 8)}</span>
          ) : (
            audit.target_id
          )}
        </td>
        <td className="text-truncate" style={{ maxWidth: "300px" }}>
          {audit.reason || <em>No reason provided</em>}
        </td>
      </tr>
      <tr className={expanded ? "" : "d-none"}>
        <td colSpan={6} className="p-0 border-0">
          {audit.action === "EDIT_DELETE" && (
            <DeleteAuditDetails data={audit.data} />
          )}
          {audit.action === "EDIT_AMENDMENT" && (
            <AmendmentAuditDetails data={audit.data} />
          )}
        </td>
      </tr>
    </>
  );
};

export default AuditRow;
