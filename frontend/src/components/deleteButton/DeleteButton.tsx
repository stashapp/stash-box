import React, { useState, useContext } from "react";
import { Button } from "react-bootstrap";

import AuthContext from "src/AuthContext";
import { isAdmin } from "src/utils";

import Modal from "src/components/modal";

interface DeleteButtonProps {
  message?: string;
  onClick: () => void;
  disabled?: boolean;
}

const DeleteButton: React.FC<DeleteButtonProps> = ({
  message,
  onClick,
  disabled = false,
}) => {
  const [showDelete, setShowDelete] = useState(false);
  const auth = useContext(AuthContext);

  const toggleModal = () => setShowDelete(true);
  const handleDelete = (status: boolean): void => {
    if (status) onClick();
    setShowDelete(false);
  };

  const deleteModal = showDelete && (
    <Modal
      message={
        message ??
        `Are you sure you want to delete this? This operation cannot be undone.`
      }
      callback={handleDelete}
    />
  );
  return (
    <>
      {deleteModal}
      {isAdmin(auth.user) && (
        <Button
          variant="danger"
          disabled={showDelete || disabled}
          onClick={toggleModal}
        >
          Delete
        </Button>
      )}
    </>
  );
};

export default DeleteButton;
