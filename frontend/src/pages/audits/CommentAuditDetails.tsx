import type { FC } from "react";
import { Link } from "react-router-dom";

import { ROUTE_EDIT } from "src/constants/route";
import { createHref } from "src/utils";

interface CommentUpdateData {
  comment_id: string;
  edit_id: string;
  previous_text: string;
}

interface CommentHideData {
  comment_id: string;
  edit_id: string;
  hidden: boolean;
}

function parse<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export const CommentUpdateAuditDetails: FC<{ data: string }> = ({ data }) => {
  const parsed = parse<CommentUpdateData>(data);
  if (!parsed) return null;

  return (
    <div className="p-3 bg-dark">
      <h6>Comment Edit Details</h6>
      <div className="mb-2">
        <strong>Edit ID:</strong>{" "}
        <Link
          to={`${createHref(ROUTE_EDIT, { id: parsed.edit_id })}#comment-${parsed.comment_id}`}
        >
          {parsed.edit_id}
        </Link>
      </div>
      <div className="mb-2">
        <strong>Comment ID:</strong>{" "}
        <Link
          to={`${createHref(ROUTE_EDIT, { id: parsed.edit_id })}#comment-${parsed.comment_id}`}
        >
          {parsed.comment_id}
        </Link>
      </div>
      <div className="mb-2">
        <strong>Previous text:</strong>
        <pre className="mb-0 mt-1">{parsed.previous_text}</pre>
      </div>
    </div>
  );
};

export const CommentHideAuditDetails: FC<{ data: string }> = ({ data }) => {
  const parsed = parse<CommentHideData>(data);
  if (!parsed) return null;

  return (
    <div className="p-3 bg-dark">
      <h6>Comment Visibility Details</h6>
      <div className="mb-2">
        <strong>Edit ID:</strong>{" "}
        <Link
          to={`${createHref(ROUTE_EDIT, { id: parsed.edit_id })}#comment-${parsed.comment_id}`}
        >
          {parsed.edit_id}
        </Link>
      </div>
      <div className="mb-2">
        <strong>Comment ID:</strong>{" "}
        <Link
          to={`${createHref(ROUTE_EDIT, { id: parsed.edit_id })}#comment-${parsed.comment_id}`}
        >
          {parsed.comment_id}
        </Link>
      </div>
      <div className="mb-2">
        <strong>Action:</strong> {parsed.hidden ? "Hidden" : "Unhidden"}
      </div>
    </div>
  );
};
