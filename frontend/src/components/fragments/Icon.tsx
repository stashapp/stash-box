import { FC } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface Props {
  icon: IconDefinition;
  className?: string;
  color?: string;
  title?: string;
}

const Icon: FC<Props> = ({ icon, className, color, title }) => (
  <FontAwesomeIcon
    title={title}
    icon={icon}
    className={`fa-icon ${className}`}
    color={color}
  />
);

export default Icon;
