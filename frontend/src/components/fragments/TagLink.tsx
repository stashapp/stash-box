import { FC } from "react";
import { Badge, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Icon } from "src/components/fragments";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";

interface IProps {
  title: string;
  link?: string;
  description?: string | null;
  className?: string;
  onRemove?: () => void;
  disabled?: boolean;
}

const TagLink: FC<IProps> = ({
  title,
  link,
  description,
  className,
  onRemove,
  disabled = false,
}) => (
  <Badge className={cx("tag-item", className)} bg="none">
    <abbr title={description || undefined}>
      {link && !disabled ? <Link to={link}>{title}</Link> : title}
    </abbr>
    {onRemove && (
      <Button onClick={onRemove}>
        <Icon icon={faXmark} />
      </Button>
    )}
  </Badge>
);

export default TagLink;
