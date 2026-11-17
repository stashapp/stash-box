import cx from "classnames";
import type { FC } from "react";

// originalImage is only set by stash-box's own cropper, which tells a crop apart from a re-upload
const CroppedIndicator: FC<{
  original: { url: string } | null | undefined;
  className?: string;
}> = ({ original, className }) =>
  original ? (
    <a
      className={cx("CroppedIndicator", className)}
      href={original.url}
      target="_blank"
      rel="noreferrer noopener"
      title="This image has been cropped; opens the uncropped original in a new tab"
    >
      Cropped &ndash; view original
    </a>
  ) : null;

export default CroppedIndicator;
