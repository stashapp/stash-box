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
  edit_id: string;
  user_id: { UUID: string; Valid: boolean } | null;
  target_type: string;
  operation: string;
  status: string;
  applied: boolean;
  vote_count: number;
  bot: boolean;
  data: unknown;
  created_at: string;
  updated_at?: string;
  closed_at?: string;
  deleted_by: string;
  deleted_at: string;
}

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
  const actionLabel =
    audit.action === "EDIT_DELETE" ? "Edit Deleted" : audit.action;

  let parsedData: EditDeleteData | null = null;
  try {
    parsedData = JSON.parse(audit.data) as EditDeleteData;
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
          {parsedData && (
            <div className="p-3 bg-dark">
              <h6>Edit Details</h6>
              <div className="mb-2">
                <strong>Edit ID:</strong> {parsedData.edit_id}
              </div>
              <div className="mb-2">
                <strong>Operation:</strong> {parsedData.operation}{" "}
                {parsedData.target_type}
              </div>
              <div className="mb-2">
                <strong>Status:</strong> {parsedData.status}
                {parsedData.applied && " (Applied)"}
              </div>
              <div className="mb-2">
                <strong>Vote Count:</strong> {parsedData.vote_count}
              </div>
              <div className="mb-2">
                <strong>Created:</strong>{" "}
                {formatDateTime(parsedData.created_at)}
              </div>
              {parsedData.closed_at && (
                <div className="mb-2">
                  <strong>Closed:</strong>{" "}
                  {formatDateTime(parsedData.closed_at)}
                </div>
              )}
              <div className="mb-2">
                <strong>Bot Edit:</strong> {parsedData.bot ? "Yes" : "No"}
              </div>
              <div className="mt-3">
                <strong>Edit Data:</strong>
                <pre className="mt-2 p-2 bg-secondary rounded">
                  <code>{JSON.stringify(parsedData.data, null, 2)}</code>
                </pre>
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
