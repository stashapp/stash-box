import React from "react";
import { Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface IProps {
  title: string;
  link?: string;
  className?: string;
  onRemove?: () => void;
  disabled?: boolean;
}

const TagLink: React.FC<IProps> = ({
  title,
  link,
  className,
  onRemove,
  disabled = false,
}) => (
  <Badge className={`tag-item ${className}`} variant="secondary">
    {link && !disabled ? <Link to={link}>{title}</Link> : title}
    {onRemove && (
      <Button onClick={onRemove}>
        <Icon icon={faTimes} />
      </Button>
    )}
  </Badge>
);

export default TagLink;
