import { FC } from "react";
import { Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

interface IProps {
  title: string;
  link?: string;
  className?: string;
  onRemove?: () => void;
  disabled?: boolean;
}

const TagLink: FC<IProps> = ({
  title,
  link,
  className,
  onRemove,
  disabled = false,
}) => (
  <Badge className={cx("tag-item", className)} bg="none">
    {link && !disabled ? <Link to={link}>{title}</Link> : title}
    {onRemove && (
      <Button onClick={onRemove}>
        <Icon icon={faTimes} />
      </Button>
    )}
  </Badge>
);

export default TagLink;
