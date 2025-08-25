import type { FC } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

interface Props {
  onNext: () => void;
  disabled?: boolean;
}

export const NavButtons: FC<Props> = ({ onNext, disabled = false }) => {
  const navigate = useNavigate();
  return (
    <div className="d-flex mt-2">
      <Button
        variant="danger"
        className="ms-auto me-2"
        onClick={() => navigate(-1)}
      >
        Cancel
      </Button>
      <Button className="me-1" onClick={onNext} disabled={disabled}>
        Next
      </Button>
    </div>
  );
};
