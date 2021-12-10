import { FC } from "react";
import { Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";

interface Props {
  onNext: () => void;
  disabled?: boolean;
}

export const NavButtons: FC<Props> = ({ onNext, disabled = false }) => {
  const history = useHistory();
  return (
    <div className="d-flex">
      <Button
        variant="danger"
        className="ms-auto me-2"
        onClick={() => history.goBack()}
      >
        Cancel
      </Button>
      <Button className="me-1" onClick={onNext} disabled={disabled}>
        Next
      </Button>
    </div>
  );
};
