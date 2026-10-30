import { faXmark } from "@fortawesome/free-solid-svg-icons";
import cx from "classnames";
import type { FC } from "react";
import Icon from "./Icon";

interface Props {
  image?: string;
  size?: 600 | 300;
  alt?: string | null;
  className?: string;
  loading?: "eager" | "lazy";
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
  loading = "eager",
  orientation = "landscape",
}) =>
  image ? (
    <img
      alt={alt ?? ""}
      className={className}
      loading={loading === "lazy" ? "lazy" : undefined}
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
