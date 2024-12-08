import { FC } from "react";
import cx from "classnames";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface Props {
  icon: IconDefinition;
  className?: string;
  color?: string;
  title?: string;
  variant?: "danger" | "success" | "info" | "warning";
}

const Icon: FC<Props> = ({ icon, className, color, title, variant }) => (
  <FontAwesomeIcon
    title={title}
    icon={icon}
    className={cx("fa-icon", className, { [`text-${variant}`]: variant })}
    color={color}
  />
);

export default Icon;
