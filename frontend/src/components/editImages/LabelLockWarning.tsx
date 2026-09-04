import type { FC } from "react";
import { Button, Modal } from "react-bootstrap";

interface LabelLockWarningProps {
  show: boolean;
  action: "apply" | "crop";
  willLockTypes: boolean;
  willLockDate: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Locking is all-or-nothing per field, not per group: applying even one
 * label locks the whole types field, so someone who sets Crop expecting to
 * still add View or State of dress afterward is in for a surprise. Same for
 * date. This is the last point where that surprise is avoidable.
 */
const LabelLockWarning: FC<LabelLockWarningProps> = ({
  show,
  action,
  willLockTypes,
  willLockDate,
  onConfirm,
  onCancel,
}) => {
  const message =
    willLockTypes && willLockDate
      ? action === "crop"
        ? "Saving this crop also applies this image's current labels and date, locking them in. Only a moderator will be able to change either afterward, including adding a label to a group you haven't touched yet."
        : "Applying now locks in this image's labels and date. Only a moderator will be able to change either afterward, including adding a label to a group you haven't touched yet."
      : willLockTypes
        ? action === "crop"
          ? "Saving this crop also applies this image's current labels, locking them in. Only a moderator will be able to change or add to them afterward, including a group you haven't touched yet."
          : "Applying now locks in this image's labels. Only a moderator will be able to change or add to them afterward, including a group you haven't touched yet."
        : action === "crop"
          ? "Saving this crop also applies this image's current date, locking it in. Only a moderator will be able to change it afterward."
          : "Applying now locks in this image's date. Only a moderator will be able to change it afterward.";

  return (
    <Modal
      show={show}
      onHide={onCancel}
      centered
      aria-labelledby="label-lock-warning-title"
    >
      <Modal.Header closeButton>
        <Modal.Title id="label-lock-warning-title">
          This can only be undone by a moderator
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>
          {action === "crop" ? "Save crop" : "Apply"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LabelLockWarning;
