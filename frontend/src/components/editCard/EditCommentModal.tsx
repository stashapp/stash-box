import { type FC, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";

import { NoteInput } from "src/components/form";
import { useUpdateEditComment } from "src/graphql";

interface Props {
  commentId: string;
  text: string;
  show: boolean;
  onHide: () => void;
}

const EditCommentModal: FC<Props> = ({ commentId, text, show, onHide }) => {
  const [comment, setComment] = useState(text);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [updateComment, { loading: saving }] = useUpdateEditComment();

  const handleClose = () => {
    setComment(text);
    setReason("");
    setError(null);
    onHide();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = comment.trim();
    if (!trimmed) return;

    setError(null);
    updateComment({
      variables: {
        input: {
          id: commentId,
          comment: trimmed,
          reason: reason.trim() || null,
        },
      },
    })
      .then(() => handleClose())
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to edit comment"),
      );
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Edit comment</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>Comment:</strong>
            </Form.Label>
            <NoteInput initialValue={text} onChange={setComment} />
          </Form.Group>
          <Form.Group>
            <Form.Label>
              <strong>Reason (optional):</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this comment being edited?"
              disabled={saving}
            />
          </Form.Group>
          {error && <div className="text-danger mt-3">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!comment.trim() || saving}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditCommentModal;
