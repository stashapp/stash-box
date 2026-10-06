import cx from "classnames";
import type { FC, ReactNode } from "react";
import { Card } from "react-bootstrap";

interface Props {
  heading?: string;
  className?: string;
  children: ReactNode;
}

const CLASSNAME = "EditorCard";

/** A titled panel grouping one region of an editor or settings page. */
const EditorCard: FC<Props> = ({ heading, className, children }) => (
  <Card className={cx(CLASSNAME, className)}>
    {heading && (
      <Card.Header className={`${CLASSNAME}-heading`}>{heading}</Card.Header>
    )}
    <Card.Body>{children}</Card.Body>
  </Card>
);

export default EditorCard;
