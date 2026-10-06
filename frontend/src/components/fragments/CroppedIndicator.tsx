import type { FC } from "react";

interface Props {
  original: { url: string } | null | undefined;
}

/**
 * The link marking an image as a crop of a retained original. originalImage
 * is only set when stash-box's own cropper produced the image, which tells
 * that apart from a manual remove-and-add of an externally cropped file
 */
const CroppedIndicator: FC<Props> = ({ original }) =>
  original ? (
    <div className="text-center text-muted">
      <a
        href={original.url}
        target="_blank"
        rel="noreferrer noopener"
        title="This image has been cropped; opens the uncropped original in a new tab"
      >
        View original
      </a>
    </div>
  ) : null;

export default CroppedIndicator;
