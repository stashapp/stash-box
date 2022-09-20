import { FC } from "react";
import {
  faVenus,
  faTransgender,
  faMars,
  faVenusMars,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";
import { GenderEnum } from "src/graphql";
import { GenderTypes } from "src/constants";

interface IconProps {
  gender?: GenderEnum | null;
}

const GenderIcon: FC<IconProps> = ({ gender }) => {
  if (gender) {
    const icon =
      gender.toLowerCase() === "male"
        ? faMars
        : gender.toLowerCase() === "female"
        ? faVenus
        : faTransgender;
    return <Icon icon={icon} title={GenderTypes[gender]} />;
  }
  return <Icon icon={faVenusMars} />;
};

export default GenderIcon;
