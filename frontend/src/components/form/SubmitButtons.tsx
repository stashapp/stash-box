import { FC } from "react";
import { Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";

interface Props {
  disabled?: boolean;
}

export const SubmitButtons: FC<Props> = ({ disabled = false }) => {
  const history = useHistory();
  return (
    <div className="d-flex mt-2">
      <Button
        variant="danger"
        className="ms-auto me-2"
        onClick={() => history.goBack()}
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
