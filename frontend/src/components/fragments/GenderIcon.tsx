import {
  faMars,
  faTransgender,
  faVenus,
  faVenusMars,
} from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import { GenderTypes } from "src/constants";
import type { GenderEnum } from "src/graphql";
import Icon from "./Icon";

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
