import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { FC } from "react";
import Icon from "./Icon";

const CLASSNAME = "DeletedImage";

const DeletedImage: FC = () => (
  <div className={CLASSNAME}>
    <Icon icon={faXmark} />
    <span>Deleted</span>
  </div>
);

export default DeletedImage;
