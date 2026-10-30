import { useFragment } from "@apollo/client/react";
import type React from "react";
import { ImageCategorizationFragmentDoc } from "src/graphql";
import { useImageTypeNames } from "src/hooks";

const CLASSNAME = "ImageTags";

interface Props {
  imageId: string;
}

const ImageTags: React.FC<Props> = ({ imageId }) => {
  const { data: image, complete } = useFragment({
    fragment: ImageCategorizationFragmentDoc,
    from: {
      __typename: "Image",
      id: imageId,
    },
  });

  const { typeName } = useImageTypeNames();

  if (!complete) {
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
