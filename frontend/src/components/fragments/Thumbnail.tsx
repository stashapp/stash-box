import { FC } from "react";

interface Props {
  image: string;
  size?: number;
  alt?: string | null;
  className?: string;
}

export const Thumbnail: FC<Props> = ({ image, size, alt, className }) => (
  <img
    alt={alt ?? ""}
    className={className}
    src={image + (size ? `?size=${size}` : "")}
  />
);
