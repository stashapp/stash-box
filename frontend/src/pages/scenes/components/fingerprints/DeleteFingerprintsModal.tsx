import type { FC } from "react";
import { Button, Modal } from "react-bootstrap";
import { faTrash, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "src/components/fragments";

interface Props {
  show: boolean;
  selectedCount: number;
  deleting: boolean;
  onHide: () => void;
  onDelete: () => Promise<boolean | undefined>;
}

export const DeleteFingerprintsModal: FC<Props> = ({
  show,
  selectedCount,
  deleting,
  onHide,
  onDelete,
}) => {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Delete Fingerprint Submissions</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          Are you sure you want to delete {selectedCount} fingerprint
          submission(s)? This action cannot be undone.
        </p>
        <p className="text-danger">
          <strong>Warning:</strong> This will delete all submissions for the
          selected fingerprints on this scene.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onDelete} disabled={deleting}>
          {deleting ? (
            <>
              <Icon icon={faSpinner} className="fa-spin me-1" />
              Deleting...
            </>
          ) : (
            <>
              <Icon icon={faTrash} className="me-1" />
              Delete
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
