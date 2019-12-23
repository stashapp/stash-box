import React from 'react';
import { Modal, Button } from 'react-bootstrap';

interface ModalProps {
    message: string;
    callback: (status: boolean) => void
}

const ModalComponent: React.FC<ModalProps> = ({ message, callback }) => {
    const handleCancel = () => (callback(false));
    const handleAccept = () => (callback(true));

    return (
        <Modal show onHide={handleCancel}>
            <Modal.Header closeButton>
            Warning
            </Modal.Header>
            <Modal.Body>{ message }</Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={handleAccept}>
            Delete
                </Button>
                <Button variant="primary" onClick={handleCancel}>
            Cancel
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ModalComponent;
