import { CombinedGraphQLErrors } from "@apollo/client";
import cx from "classnames";
import { type FC, useState } from "react";
import { Badge, Button, Card, Form } from "react-bootstrap";
import { Link } from "react-router-dom";

import { NoteInput } from "src/components/form";
import { useHideEditComment, useUpdateEditComment } from "src/graphql";
import { useCurrentUser } from "src/hooks";
import { formatDateTime, Markdown, userHref } from "src/utils";

const CLASSNAME = "EditComment";

interface Props {
  id: string;
  comment: string;
  date: string;
  updated?: string | null;
  hidden?: boolean;
  isPrimary?: boolean;
  user?: { name: string; id: string } | null;
}

const EditComment: FC<Props> = ({
  id,
  comment,
  date,
  updated,
  hidden,
  isPrimary,
  user,
}) => {
  const { isModerator } = useCurrentUser();
  const [mode, setMode] = useState<"edit" | "hide" | null>(null);
  const [text, setText] = useState(comment);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [updateComment, { loading: saving }] = useUpdateEditComment();
  const [hideComment, { loading: hiding }] = useHideEditComment();

  const reset = () => {
    setMode(null);
    setText(comment);
    setReason("");
    setError("");
  };

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const res = await updateComment({
      variables: {
        input: { id, comment: trimmed, reason: reason.trim() || null },
      },
    });
    if (CombinedGraphQLErrors.is(res.error)) {
      setError(res.error.message);
    } else {
      reset();
    }
  };

  const handleHide = async () => {
    const res = await hideComment({
      variables: {
        input: { id, hidden: !hidden, reason: reason.trim() || null },
      },
    });
    if (CombinedGraphQLErrors.is(res.error)) {
      setError(res.error.message);
    } else {
      reset();
    }
  };

  return (
    <Card
      id={`comment-${id}`}
      className={cx(CLASSNAME, { "EditComment--hidden": hidden })}
    >
      <Card.Body className="pb-0">
        {mode === "edit" ? (
          <Form.Group className="mb-2">
            <NoteInput
              initialValue={comment}
              className={cx({ "is-invalid": error })}
              onChange={setText}
            />
            <Form.Control
              className="mt-2"
              placeholder="Reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.currentTarget.value)}
            />
            <Form.Control.Feedback type="invalid" className="text-end">
              {error}
            </Form.Control.Feedback>
            <div className="d-flex mt-2">
              <Button variant="secondary" className="ms-auto" onClick={reset}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="ms-2"
                disabled={saving || !text.trim()}
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </Form.Group>
        ) : (
          <Markdown text={comment} unique={id} />
        )}
      </Card.Body>
      {mode === "hide" && (
        <Card.Body className="py-0">
          <Form.Control
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.currentTarget.value)}
          />
          <div className="d-flex mt-2">
            <Button variant="secondary" className="ms-auto" onClick={reset}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="ms-2"
              disabled={hiding}
              onClick={handleHide}
            >
              {hidden ? "Unhide" : "Hide"}
            </Button>
          </div>
        </Card.Body>
      )}
      <Card.Footer className="d-flex align-items-center justify-content-end">
        {isModerator && mode === null && (
          <span className="EditComment-actions me-auto">
            <Button
              size="sm"
              variant="outline-danger"
              className="me-2"
              onClick={() => setMode("edit")}
            >
              Edit
            </Button>
            {!isPrimary && (
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => setMode("hide")}
              >
                {hidden ? "Unhide" : "Hide"}
              </Button>
            )}
          </span>
        )}
        {hidden && (
          <Badge bg="danger" className="me-2">
            Hidden by moderator
          </Badge>
        )}
        {user ? (
          <Link to={userHref(user)}>{user.name}</Link>
        ) : (
          <span>Deleted User</span>
        )}
        <span className="mx-1">&bull;</span>
        <span>{formatDateTime(date, false)}</span>
        {updated && (
          <span className="ms-1" title={formatDateTime(updated, false)}>
            (edited by moderator)
          </span>
        )}
      </Card.Footer>
    </Card>
  );
};

export default EditComment;
