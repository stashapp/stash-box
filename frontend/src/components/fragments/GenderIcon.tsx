import { FC } from "react";
import {
  faVenus,
  faTransgenderAlt,
  faMars,
  faVenusMars,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

interface IconProps {
  gender?: string | null;
}

const GenderIcon: FC<IconProps> = ({ gender }) => {
  if (gender) {
    const icon =
      gender.toLowerCase() === "male"
        ? faMars
        : gender.toLowerCase() === "female"
        ? faVenus
        : faTransgenderAlt;
    return <Icon icon={icon} />;
  }
  return <Icon icon={faVenusMars} />;
};

export default GenderIcon;
