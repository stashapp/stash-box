import { FC, useState } from "react";
import { Button } from "react-bootstrap";

import Modal from "src/components/modal";
import { useCurrentUser } from "src/hooks";

interface DeleteButtonProps {
  message?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const DeleteButton: FC<DeleteButtonProps> = ({
  message,
  onClick,
  disabled = false,
  className,
}) => {
  const { isAdmin } = useCurrentUser();
  const [showDelete, setShowDelete] = useState(false);

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
      {isAdmin && (
        <Button
          variant="danger"
          disabled={showDelete || disabled}
          onClick={toggleModal}
          className={className}
        >
          Delete
        </Button>
      )}
    </>
  );
};

export default DeleteButton;
