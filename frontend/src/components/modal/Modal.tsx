import { ReactNode, FC } from "react";
import { Modal, Button } from "react-bootstrap";

interface ModalProps {
  callback: (status: boolean) => void;
  cancelTerm?: string;
  acceptTerm?: string;
}

interface MessageProps {
  message: string;
  children?: never;
}
interface ElementProps {
  children: ReactNode;
  message?: never;
}

const ModalComponent: FC<ModalProps & (MessageProps | ElementProps)> = ({
  message,
  children,
  callback,
  cancelTerm = "Cancel",
  acceptTerm = "Delete",
}) => {
  const handleCancel = () => callback(false);
  const handleAccept = () => callback(true);

  const content = message || children;

  return (
    <Modal show onHide={handleCancel}>
      <Modal.Header closeButton>
        <b>Warning</b>
      </Modal.Header>
      <Modal.Body>{content}</Modal.Body>
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
