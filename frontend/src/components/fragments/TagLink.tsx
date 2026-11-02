import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { Link } from "@tanstack/react-router";
import cx from "classnames";
import type { FC } from "react";
import { Badge, Button } from "react-bootstrap";
import { Icon } from "src/components/fragments";
import type { EntityLinkOptions } from "src/utils/route";

interface IProps {
  title: string;
  link?: EntityLinkOptions;
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
      {link && !disabled ? <Link {...link}>{title}</Link> : title}
    </abbr>
    {onRemove && (
      <Button onClick={onRemove}>
        <Icon icon={faXmark} />
      </Button>
    )}
  </Badge>
);

export default TagLink;
