import { FC } from "react";
import {
  faVenus,
  faTransgender,
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
        : faTransgender;
    return <Icon icon={icon} />;
  }
  return <Icon icon={faVenusMars} />;
};

export default GenderIcon;
