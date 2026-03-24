import { type FC, useState } from "react";
import { Table, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

import { useModAudits } from "src/graphql";
import { usePagination } from "src/hooks";
import { ErrorMessage, Icon } from "src/components/fragments";
import { List } from "src/components/list";
import { formatDateTime, createHref } from "src/utils";
import { ROUTE_USER } from "src/constants/route";
import Title from "src/components/title";

const PER_PAGE = 25;

interface EditDeleteData {
  id: string;
  user_id: { UUID: string; Valid: boolean } | null;
  target_type: string;
  operation: string;
  status: string;
  applied: boolean;
  votes: number;
  bot: boolean;
  data: unknown;
  created_at: string;
  deleted_by: string;
  deleted_at: string;
}

interface EditAmendmentData {
  edit_id: string;
  amended_by: string;
  amended_at: string;
  data_before: unknown;
  data_after: unknown;
  fields_removed: string[];
}

const actionLabels: Record<string, string> = {
  EDIT_DELETE: "Edit Deleted",
  EDIT_AMENDMENT: "Edit Amended",
};

const AuditRow: FC<{
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
}> = ({ audit }) => {
  const [expanded, setExpanded] = useState(false);
  const actionLabel = actionLabels[audit.action] ?? audit.action;

  let deleteData: EditDeleteData | null = null;
  let amendmentData: EditAmendmentData | null = null;
  try {
    if (audit.action === "EDIT_DELETE") {
      deleteData = JSON.parse(audit.data) as EditDeleteData;
    } else if (audit.action === "EDIT_AMENDMENT") {
      amendmentData = JSON.parse(audit.data) as EditAmendmentData;
    }
  } catch (e) {
    console.error("Failed to parse audit data", e);
  }

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
          {deleteData && (
            <div className="p-3 bg-dark">
              <h6>Edit Details</h6>
              <div className="mb-2">
                <strong>Edit ID:</strong> {deleteData.id}
              </div>
              <div className="mb-2">
                <strong>Operation:</strong> {deleteData.operation}{" "}
                {deleteData.target_type}
              </div>
              <div className="mb-2">
                <strong>Status:</strong> {deleteData.status}
                {deleteData.applied && " (Applied)"}
              </div>
              <div className="mb-2">
                <strong>Vote Count:</strong> {deleteData.votes}
              </div>
              <div className="mb-2">
                <strong>Created:</strong>{" "}
                {formatDateTime(deleteData.created_at)}
              </div>
              <div className="mb-2">
                <strong>Bot Edit:</strong> {deleteData.bot ? "Yes" : "No"}
              </div>
              <div className="mt-3">
                <strong>Edit Data:</strong>
                <pre className="mt-2 p-2 bg-secondary rounded">
                  <code>{JSON.stringify(deleteData.data, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}
          {amendmentData && (
            <div className="p-3 bg-dark">
              <h6>Amendment Details</h6>
              <div className="mb-2">
                <strong>Edit ID:</strong> {amendmentData.edit_id}
              </div>
              <div className="mb-2">
                <strong>Removed:</strong>
                <ul className="mb-0 mt-1">
                  {(() => {
                    const before =
                      (
                        amendmentData.data_before as {
                          new_data?: Record<string, unknown>;
                        }
                      )?.new_data ?? {};
                    const after =
                      (
                        amendmentData.data_after as {
                          new_data?: Record<string, unknown>;
                        }
                      )?.new_data ?? {};
                    const removed: { field: string; value: unknown }[] = [];
                    for (const key of Object.keys(before)) {
                      if (!(key in after)) {
                        removed.push({ field: key, value: before[key] });
                      } else if (
                        Array.isArray(before[key]) &&
                        Array.isArray(after[key]) &&
                        (before[key] as unknown[]).length >
                          (after[key] as unknown[]).length
                      ) {
                        const beforeArr = before[key] as unknown[];
                        const afterArr = after[key] as unknown[];
                        const removedItems = beforeArr.filter(
                          (_, i) =>
                            i >= afterArr.length ||
                            JSON.stringify(beforeArr[i]) !==
                              JSON.stringify(afterArr[i]),
                        );
                        if (removedItems.length > 0) {
                          removed.push({ field: key, value: removedItems });
                        }
                      }
                    }
                    return removed.map(({ field, value }) => (
                      <li key={field}>
                        <strong>{field}:</strong>{" "}
                        {typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                      </li>
                    ));
                  })()}
                </ul>
              </div>
            </div>
          )}
        </td>
      </tr>
    </>
  );
};

const AuditsComponent: FC = () => {
  const { page, setPage } = usePagination();
  const { loading, data } = useModAudits({
    input: {
      page,
      per_page: PER_PAGE,
    },
  });

  if (!loading && !data)
    return <ErrorMessage error="Failed to load audit logs." />;

  const audits = data?.queryModAudits.audits.map((audit) => (
    <AuditRow key={audit.id} audit={audit} />
  ));

  return (
    <>
      <Title page="Audit Logs" />
      <h3>Moderator Audit Logs</h3>
      <List
        entityName="audits"
        page={page}
        setPage={setPage}
        perPage={PER_PAGE}
        loading={loading}
        listCount={data?.queryModAudits.count}
      >
        <Table striped className="audits-table" variant="dark">
          <thead>
            <tr>
              <th style={{ width: "40px" }}></th>
              <th>Date</th>
              <th>Action</th>
              <th>User</th>
              <th>Target</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>{audits}</tbody>
        </Table>
      </List>
    </>
  );
};

export default AuditsComponent;
