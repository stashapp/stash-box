import { type FC, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

import { useHideEditComment } from "src/graphql";

interface Props {
  commentId: string;
  hidden: boolean;
  show: boolean;
  onHide: () => void;
}

const HideCommentModal: FC<Props> = ({ commentId, hidden, show, onHide }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hideComment, { loading: saving }] = useHideEditComment();

  // Toggling: if currently hidden the action unhides, and vice versa
  const action = hidden ? "Unhide" : "Hide";
  const pastTense = hidden ? "unhidden" : "hidden";

  const handleClose = () => {
    setReason("");
    setError(null);
    onHide();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    hideComment({
      variables: {
        input: { id: commentId, hidden: !hidden, reason: reason.trim() || null },
      },
    })
      .then(() => handleClose())
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : `Failed to ${action.toLowerCase()} comment`,
        ),
      );
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{action} comment</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <p>
            {hidden
              ? "This comment will be visible to everyone again."
              : "This comment will be hidden from everyone except moderators and its author."}
          </p>
          <Form.Group>
            <Form.Label>
              <strong>Reason (optional):</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Why is this comment being ${pastTense}?`}
              disabled={saving}
            />
          </Form.Group>
          {error && <div className="text-danger mt-3">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" disabled={saving}>
            {saving ? `${action.replace(/e$/, "")}ing...` : action}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default HideCommentModal;
