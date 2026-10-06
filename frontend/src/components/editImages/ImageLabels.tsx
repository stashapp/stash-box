import type { ImageTypeGroupsQuery } from "src/graphql";

import ImageLabelsClassification from "./ImageLabelsClassification";
import ImageLabelsMetadata from "./ImageLabelsMetadata";
import type { Labelling } from "./types";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

interface ImageLabelsProps<T extends Labelling> {
  groups: ImageTypeGroup[];
  value: T;
  onChange: (value: T) => void;
  labelsDisabled?: boolean;
  dateDisabled?: boolean;
}

const CLASSNAME = "ImageLabels";

const ImageLabels = <T extends Labelling>({
  groups,
  value,
  onChange,
  labelsDisabled = false,
  dateDisabled = false,
}: ImageLabelsProps<T>) => (
  <div className={CLASSNAME}>
    <ImageLabelsClassification
      groups={groups}
      value={value}
      onChange={onChange}
      labelsDisabled={labelsDisabled}
    />
    <ImageLabelsMetadata
      value={value}
      onChange={onChange}
      dateDisabled={dateDisabled}
    />
  </div>
);

export default ImageLabels;
