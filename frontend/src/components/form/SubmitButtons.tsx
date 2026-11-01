import { useRouter } from "@tanstack/react-router";
import type { FC } from "react";
import { Button } from "react-bootstrap";

interface Props {
  disabled?: boolean;
}

export const SubmitButtons: FC<Props> = ({ disabled = false }) => {
  const router = useRouter();
  return (
    <div className="d-flex mt-2">
      <Button
        variant="danger"
        className="ms-auto me-2"
        onClick={() => router.history.go(-1)}
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
