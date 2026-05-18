import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import cx from "classnames";
import type { FC } from "react";

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
