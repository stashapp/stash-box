import type { FC } from "react";

interface EditAmendmentData {
  edit_id: string;
  removed_data: Record<string, unknown>;
}

function parseAmendmentData(data: string): EditAmendmentData | null {
  try {
    return JSON.parse(data) as EditAmendmentData;
  } catch {
    return null;
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

const AmendmentAuditDetails: FC<{ data: string }> = ({ data }) => {
  const parsed = parseAmendmentData(data);
  if (!parsed?.removed_data) return null;

  const entries = Object.entries(parsed.removed_data);
  if (entries.length === 0) return null;

  return (
    <div className="p-3 bg-dark">
      <h6>Amendment Details</h6>
      <div className="mb-2">
        <strong>Edit ID:</strong> {parsed.edit_id}
      </div>
      <div className="mb-2">
        <strong>Removed:</strong>
        <ul className="mb-0 mt-1">
          {entries.map(([field, value]) => (
            <li key={field}>
              <strong>{field}:</strong>
              <pre className="mb-0 ms-2">{formatValue(value)}</pre>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AmendmentAuditDetails;
