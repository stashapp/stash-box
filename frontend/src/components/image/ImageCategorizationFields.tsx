import type React from "react";
import type { ImageTypeGroupsQuery } from "src/graphql";

import ImageClassification from "./ImageClassification";
import ImageDate from "./ImageDate";
import type { ImageCategorization } from "./types";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

interface Props {
  groups: ImageTypeGroup[];
  value: ImageCategorization;
  onChange: (value: ImageCategorization) => void;
  readOnly?: boolean;
}

const CLASSNAME = "ImageCategorizationFields";

const ImageCategorizationFields: React.FC<Props> = ({
  groups,
  value,
  onChange,
  readOnly = false,
}) => (
  <div className={CLASSNAME}>
    <ImageClassification
      groups={groups}
      value={value}
      onChange={onChange}
      readOnly={readOnly}
    />
    <ImageDate value={value} onChange={onChange} readOnly={readOnly} />
  </div>
);

export default ImageCategorizationFields;
