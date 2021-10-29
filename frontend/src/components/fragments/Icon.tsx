import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface IIcon {
  icon: IconDefinition;
  className?: string;
  color?: string;
}

const Icon: React.FC<IIcon> = ({ icon, className, color }) => (
  <FontAwesomeIcon
    icon={icon}
    className={`fa-icon ${className}`}
    color={color}
  />
);

export default Icon;
