import type React from "react";
import type { ImageTypeGroupsQuery } from "src/graphql";

import ImageLabelsClassification from "./ImageLabelsClassification";
import ImageLabelsMetadata from "./ImageLabelsMetadata";
import type { ImageCategorization } from "./types";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

interface Props {
  groups: ImageTypeGroup[];
  value: ImageCategorization;
  onChange: (value: ImageCategorization) => void;
  readOnly?: boolean;
}

const CLASSNAME = "ImageLabels";

const ImageLabels: React.FC<Props> = ({
  groups,
  value,
  onChange,
  readOnly = false,
}) => (
  <div className={CLASSNAME}>
    <ImageLabelsClassification
      groups={groups}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
    />
    <ImageLabelsMetadata
      value={value}
      onChange={onChange}
      readOnly={readOnly}
    />
  </div>
);

export default ImageLabels;
