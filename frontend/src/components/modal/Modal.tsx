import { FC } from "react";
import { Modal, Button } from "react-bootstrap";

interface ModalProps {
  message: string;
  callback: (status: boolean) => void;
  cancelTerm?: string;
  acceptTerm?: string;
}

const ModalComponent: FC<ModalProps> = ({
  message,
  callback,
  cancelTerm = "Cancel",
  acceptTerm = "Delete",
}) => {
  const handleCancel = () => callback(false);
  const handleAccept = () => callback(true);

  return (
    <Modal show onHide={handleCancel}>
      <Modal.Header closeButton>Warning</Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={handleAccept}>
          {acceptTerm}
        </Button>
        <Button variant="primary" onClick={handleCancel}>
          {cancelTerm}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalComponent;
