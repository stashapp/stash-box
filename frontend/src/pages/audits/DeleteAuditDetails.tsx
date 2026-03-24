import type { FC } from "react";

import { formatDateTime } from "src/utils";

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

const DeleteAuditDetails: FC<{ data: string }> = ({ data }) => {
  let parsed: EditDeleteData;
  try {
    parsed = JSON.parse(data) as EditDeleteData;
  } catch {
    return null;
  }

  return (
    <div className="p-3 bg-dark">
      <h6>Edit Details</h6>
      <div className="mb-2">
        <strong>Edit ID:</strong> {parsed.id}
      </div>
      <div className="mb-2">
        <strong>Operation:</strong> {parsed.operation} {parsed.target_type}
      </div>
      <div className="mb-2">
        <strong>Status:</strong> {parsed.status}
        {parsed.applied && " (Applied)"}
      </div>
      <div className="mb-2">
        <strong>Vote Count:</strong> {parsed.votes}
      </div>
      <div className="mb-2">
        <strong>Created:</strong> {formatDateTime(parsed.created_at)}
      </div>
      <div className="mb-2">
        <strong>Bot Edit:</strong> {parsed.bot ? "Yes" : "No"}
      </div>
      <div className="mt-3">
        <strong>Edit Data:</strong>
        <pre className="mt-2 p-2 bg-secondary rounded">
          <code>{JSON.stringify(parsed.data, null, 2)}</code>
        </pre>
      </div>
    </div>
  );
};

export default DeleteAuditDetails;
