import React from "react";
import {
  faVenus,
  faTransgenderAlt,
  faMars,
  faVenusMars,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IconProps {
  gender?: string | null;
}

const GenderIcon: React.FC<IconProps> = ({ gender }) => {
  if (gender) {
    const icon =
      gender.toLowerCase() === "male"
        ? faMars
        : gender.toLowerCase() === "female"
        ? faVenus
        : faTransgenderAlt;
    return <FontAwesomeIcon icon={icon} />;
  }
  return <FontAwesomeIcon icon={faVenusMars} />;
};

export default GenderIcon;
