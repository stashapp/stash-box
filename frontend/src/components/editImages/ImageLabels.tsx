import type { ImageTypeGroupsQuery } from "src/graphql";

import ImageLabelsClassification from "./ImageLabelsClassification";
import ImageLabelsMetadata from "./ImageLabelsMetadata";
import type { TypedImage } from "./types";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

/**
 * Everything this control touches. Stated structurally rather than as a
 * TypedImage, so the upload form (which is labelling something that is not an
 * image yet) can use the same control as the lightbox gallery
 */
export type Labelling = Pick<TypedImage, "types" | "date">;

interface ImageLabelsProps<T extends Labelling> {
  groups: ImageTypeGroup[];
  value: T;
  onChange: (value: T) => void;
  /**
   * Changing labels on an image that already carries some requires
   * MODERATE; this disables the label controls for anyone without it,
   * rather than letting them attempt the change and hit a server-side
   * rejection. Independent of dateDisabled: an image can already have one
   * of the two set and still take a first EDIT-role save of the other --
   * someone who labelled an image earlier can still be the one who dates it
   * later.
   */
  labelsDisabled?: boolean;
  /** Same as labelsDisabled, but for the date field specifically. */
  dateDisabled?: boolean;
}

const CLASSNAME = "EditImages-labels";

/**
 * The taxonomy is five small, closed, mutually-exclusive-within-themselves
 * groups (3-7 choices each) rather than an open vocabulary, so this is a
 * fieldset of radios per group -- every choice visible and comparable at
 * once, the same shape VoteBar already uses for Accept/Reject/Abstain --
 * rather than the scene tag picker's searchable combobox, which is built for
 * a set with no practical upper bound.
 *
 * Groups are exclusive so choosing a second value in one group replaces the
 * first rather than adding to it; conflicts_with rules out specific values
 * across group boundaries (a face crop can't also be topless), shown as a
 * disabled option with a reason rather than one that silently isn't there.
 *
 * Classification and Metadata are two separate components under the hood --
 * see ImageLabelsClassification and ImageLabelsMetadata -- recombined here,
 * so a host that wants to lay the two halves out differently can place them
 * itself instead of taking this stack.
 */
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
