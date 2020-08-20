import React from "react";
import { Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";

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
    {/* encodeURI must be used twice since <Link> decodes it once */}
    {link && !disabled ? (
      <Link to={encodeURI(encodeURI(link))}>{title}</Link>
    ) : (
      title
    )}
    {onRemove && (
      <Button onClick={onRemove}>
        <Icon icon="times" />
      </Button>
    )}
  </Badge>
);

export default TagLink;
