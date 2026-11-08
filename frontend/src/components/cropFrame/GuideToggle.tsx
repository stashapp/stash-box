import type { FC } from "react";
import { Button } from "react-bootstrap";

const GuideToggle: FC<{ shown: boolean; onToggle: () => void }> = ({
  shown,
  onToggle,
}) => (
  <Button
    className="GuideToggle minimal"
    variant="link"
    aria-pressed={shown}
    onClick={onToggle}
  >
    {shown ? "Hide guides" : "Show guides"}
  </Button>
);

export default GuideToggle;
