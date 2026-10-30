import { useFragment } from "@apollo/client/react";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import type React from "react";
import { Icon } from "src/components/fragments";
import { ImageCategorizationFragmentDoc } from "src/graphql";

const CLASSNAME = "ImageOrganizedIndicator";

interface Props {
  imageId: string;
  organized?: boolean;
}

const ImageOrganizedIndicator: React.FC<Props> = ({
  imageId,
  organized = false,
}) => {
  const { data: image, complete } = useFragment({
    fragment: ImageCategorizationFragmentDoc,
    from: {
      __typename: "Image",
      id: imageId,
    },
  });

  const isOrganized = complete ? image.organized : organized;

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
