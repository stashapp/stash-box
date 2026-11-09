import type React from "react";
import { useImageCategorizationFragment, useImageTypeNames } from "src/hooks";

const CLASSNAME = "ImageTags";

interface Props {
  imageId: string;
}

const ImageTags: React.FC<Props> = ({ imageId }) => {
  const image = useImageCategorizationFragment(imageId);

  const { typeName } = useImageTypeNames();

  if (!image) {
    return null;
  }

  const labels = image.types.map(typeName);

  if (image.date) {
    labels.push(image.date);
  }

  if (labels.length === 0) {
    return null;
  }

  return (
    <span className={CLASSNAME}>
      {labels.map((label) => (
        <span key={label} className={`${CLASSNAME}-tag`}>
          {label}
        </span>
      ))}
    </span>
  );
};

export default ImageTags;
