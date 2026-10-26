import type React from "react";
import { Card } from "react-bootstrap";

interface Props {
  heading: string;
  children: React.ReactNode;
}

const CLASSNAME = "EditorCard";

const EditorCard: React.FC<Props> = ({ heading, children }) => (
  <Card className={CLASSNAME}>
    <Card.Header className={`${CLASSNAME}-heading`}>{heading}</Card.Header>
    <Card.Body>{children}</Card.Body>
  </Card>
);

export default EditorCard;
