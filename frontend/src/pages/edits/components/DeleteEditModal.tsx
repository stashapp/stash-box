import { type FC, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { useDeleteEdit } from "src/graphql";
import { ROUTE_EDITS } from "src/constants/route";
import { EditOperationTypes, EditTargetTypes } from "src/constants";
import type { EditFragment } from "src/graphql";

interface Props {
  edit: EditFragment;
  show: boolean;
  onHide: () => void;
}

const DeleteEditModal: FC<Props> = ({ edit, show, onHide }) => {
  const navigate = useNavigate();
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteEdit, { loading: deleting }] = useDeleteEdit();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteReason.trim()) return;

    deleteEdit({
      variables: {
        input: {
          id: edit.id,
          reason: deleteReason,
        },
      },
    })
      .then(() => {
        onHide();
        navigate(ROUTE_EDITS);
      })
      .catch((error) => {
        console.error("Failed to delete edit:", error);
      });
  };

  const handleClose = () => {
    setDeleteReason("");
    onHide();
  };

  const editType = `${EditOperationTypes[edit.operation]} ${EditTargetTypes[edit.target_type]}`;
  const userName = edit.user?.name || "Unknown User";
  const editIdShort = edit.id.slice(0, 8);

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          Delete {editType} - {editIdShort} by {userName}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group>
            <Form.Label>
              <strong>Reason for deletion (required):</strong>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              placeholder="Enter the reason for deleting this edit..."
              required
              disabled={deleting}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={deleting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            disabled={!deleteReason.trim() || deleting}
          >
            {deleting ? "Deleting..." : "Delete Edit"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default DeleteEditModal;
