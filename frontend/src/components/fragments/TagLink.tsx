import React from "react";
import { Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";

interface IProps {
  title: string;
  link?: string;
  className?: string;
  onRemove?: () => void;
}

const TagLink: React.FC<IProps> = ({ title, link, className, onRemove }) => (
  <Badge className={`tag-item ${className}`} variant="secondary">
    {link ? <Link to={link}>{title}</Link> : title}
    {onRemove && (
      <Button onClick={onRemove}>
        <Icon icon="times" />
      </Button>
    )}
  </Badge>
);

export default TagLink;
