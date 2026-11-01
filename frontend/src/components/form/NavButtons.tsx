import { useRouter } from "@tanstack/react-router";
import type { FC } from "react";
import { Button } from "react-bootstrap";

interface Props {
  onNext: () => void;
  disabled?: boolean;
}

export const NavButtons: FC<Props> = ({ onNext, disabled = false }) => {
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
      <Button className="me-1" onClick={onNext} disabled={disabled}>
        Next
      </Button>
    </div>
  );
};
