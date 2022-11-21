import { FC } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

interface Props {
  disabled?: boolean;
}

export const SubmitButtons: FC<Props> = ({ disabled = false }) => {
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
      <Button type="submit" disabled className="d-none" aria-hidden="true" />
      <Button type="submit" disabled={disabled}>
        Submit Edit
      </Button>
    </div>
  );
};
