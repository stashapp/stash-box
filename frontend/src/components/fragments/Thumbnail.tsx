import { FC } from "react";
import cx from "classnames";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

interface Props {
  image?: string;
  size?: number;
  alt?: string | null;
  className?: string;
  orientation?: "portrait" | "landscape";
}

export const Thumbnail: FC<Props> = ({
  image,
  size,
  alt,
  className,
  orientation = "landscape",
}) =>
  image ? (
    <img
      alt={alt ?? ""}
      className={className}
      src={image + (size ? `?size=${size}` : "")}
      srcSet={size ? `${image}?size=${size * 2} ${size * 2}w` : ""}
    />
  ) : (
    <div
      className={cx(className, "Thumbnail-empty")}
      style={{ aspectRatio: orientation === "landscape" ? "16/9" : "2/3" }}
    >
      <Icon icon={faXmark} />
    </div>
  );
