import { FC } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "./Icon";

interface Props {
  image?: string;
  size?: number;
  alt?: string | null;
  className?: string;
}

export const Thumbnail: FC<Props> = ({ image, size, alt, className }) =>
  image ? (
    <img
      alt={alt ?? ""}
      className={className}
      src={image + (size ? `?size=${size}` : "")}
      srcSet={size ? `${image}?size=${size * 2} ${size * 2}w` : ""}
    />
  ) : (
    <div className="Thumbnail-empty" style={{ aspectRatio: "16/9" }}>
      <Icon icon={faXmark} />
    </div>
  );
