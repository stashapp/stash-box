import { FC } from "react";
import cx from "classnames";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

interface Props {
  image?: string;
  size?: 600 | 300;
  alt?: string | null;
  className?: string;
  orientation?: "portrait" | "landscape";
}

const doubleSize = {
  300: 600,
  600: 1280,
};

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
      srcSet={
        size ? `${image}?size=${doubleSize[size]} ${doubleSize[size]}w` : ""
      }
    />
  ) : (
    <div
      className={cx(className, "Thumbnail-empty")}
      style={{ aspectRatio: orientation === "landscape" ? "16/9" : "2/3" }}
    >
      <Icon icon={faXmark} />
    </div>
  );
