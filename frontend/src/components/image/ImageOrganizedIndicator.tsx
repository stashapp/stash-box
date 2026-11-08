import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import type React from "react";
import { Icon } from "src/components/fragments";
import { useImageCategorizationFragment } from "src/hooks";

const CLASSNAME = "ImageOrganizedIndicator";

interface Props {
  imageId: string;
  organized?: boolean;
}

const ImageOrganizedIndicator: React.FC<Props> = ({
  imageId,
  organized = false,
}) => {
  const isOrganized =
    useImageCategorizationFragment(imageId)?.organized ?? organized;

  if (!isOrganized) {
    return null;
  }

  return (
    <span className={CLASSNAME} title="Organized">
      <Icon icon={faCircleCheck} />
    </span>
  );
};

export default ImageOrganizedIndicator;
