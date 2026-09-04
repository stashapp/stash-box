import cx from "classnames";
import { useId, useMemo } from "react";

import { EditorCard } from "src/components/fragments";
import type { ImageTypeEnum, ImageTypeGroupsQuery } from "src/graphql";

import type { Labelling } from "./ImageLabels";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];
type ImageType = ImageTypeGroup["types"][number];

interface Props<T extends Labelling> {
  groups: ImageTypeGroup[];
  value: T;
  onChange: (value: T) => void;
  labelsDisabled?: boolean;
}

const CLASSNAME = "EditImages-labels";

/**
 * The type-picking half of ImageLabels, split out so a host can place it
 * apart from the date field -- it wants width for its rows of options, where
 * the date is happy in a narrow column. See ImageLabels for the taxonomy
 * notes; this piece owns none of the date logic.
 */
const ImageLabelsClassification = <T extends Labelling>({
  groups,
  value,
  onChange,
  labelsDisabled = false,
}: Props<T>) => {
  const idPrefix = useId();

  const { byKey, groupOf } = useMemo(() => {
    const byKey = new Map<string, ImageType>();
    const groupOf = new Map<string, string>();
    for (const group of groups) {
      for (const type of group.types) {
        byKey.set(type.key, type);
        groupOf.set(type.key, group.key);
      }
    }
    return { byKey, groupOf };
  }, [groups]);

  // Which currently-chosen type (if any) blocks a given value via
  // conflicts_with, so a disabled option can say why rather than just not
  // responding.
  const blockedBy = useMemo(() => {
    const blockers = new Map<string, ImageType>();
    for (const chosenKey of value.types) {
      const chosen = byKey.get(chosenKey);
      if (!chosen) continue;
      for (const blocked of chosen.conflicts_with) {
        if (!blockers.has(blocked)) blockers.set(blocked, chosen);
      }
    }
    return blockers;
  }, [value.types, byKey]);

  const chooseType = (groupKey: string, key: ImageTypeEnum | null) => {
    const withoutGroup = value.types.filter(
      (type) => groupOf.get(type) !== groupKey,
    );
    onChange({ ...value, types: key ? [...withoutGroup, key] : withoutGroup });
  };

  return (
    <EditorCard
      className={`${CLASSNAME}-classification`}
      heading="Classification"
    >
      {labelsDisabled ? (
        // Nothing here is actionable for this session -- MODERATE is
        // required to touch any of it -- so there is nothing to gain from
        // a row of buttons that all reject the click, and a real cost:
        // interactive-looking controls invite the attempt anyway. A plain
        // readout says what the image carries without claiming that it can
        // be changed.
        <div
          className={`${CLASSNAME}-summary`}
          title="Requires moderator to change"
        >
          {groups.map((group) => {
            const selected = value.types.find(
              (key) => groupOf.get(key) === group.key,
            );
            const type = selected ? byKey.get(selected) : undefined;
            if (!type) return null;
            return (
              <span key={group.key} className={`${CLASSNAME}-summary-item`}>
                <span className={`${CLASSNAME}-summary-group`}>
                  {group.name}:
                </span>{" "}
                {type.name}
              </span>
            );
          })}
        </div>
      ) : (
        <div className={`${CLASSNAME}-groups`}>
          {groups.map((group) => {
            const selected = value.types.find(
              (key) => groupOf.get(key) === group.key,
            );
            const selectedType = selected ? byKey.get(selected) : undefined;
            // A type or group switched off stays visible if this image is
            // already carrying it -- there is otherwise no way to see, or
            // change your mind about, a label that predates the switch-off
            // -- but is not offered to anyone starting from a blank group.
            const offered = group.types.filter(
              (type) =>
                (group.enabled && type.enabled) || type.key === selected,
            );
            if (offered.length === 0) return null;

            return (
              <fieldset className={`${CLASSNAME}-group`} key={group.key}>
                <legend className={`${CLASSNAME}-group-legend`}>
                  {group.name}
                </legend>
                <div className={`${CLASSNAME}-group-options`}>
                  <label
                    className={cx(
                      `${CLASSNAME}-option`,
                      `${CLASSNAME}-option-none`,
                      {
                        [`${CLASSNAME}-option-selected`]: !selected,
                      },
                    )}
                    title="It's always valid to leave an image unlabeled"
                  >
                    <input
                      type="radio"
                      name={`${idPrefix}-${group.key}`}
                      checked={!selected}
                      onChange={() => chooseType(group.key, null)}
                    />
                    <span>None</span>
                  </label>
                  {offered.map((type) => {
                    const blocker =
                      type.key === selected
                        ? undefined
                        : blockedBy.get(type.key);
                    const title = blocker
                      ? `Conflicts with "${blocker.name}"`
                      : (type.description ?? undefined);
                    return (
                      <label
                        key={type.key}
                        className={cx(`${CLASSNAME}-option`, {
                          [`${CLASSNAME}-option-selected`]:
                            type.key === selected,
                          [`${CLASSNAME}-option-blocked`]: !!blocker,
                        })}
                        title={title}
                      >
                        <input
                          type="radio"
                          name={`${idPrefix}-${group.key}`}
                          checked={type.key === selected}
                          disabled={!!blocker}
                          onChange={() => chooseType(group.key, type.key)}
                        />
                        <span>{type.name}</span>
                      </label>
                    );
                  })}
                </div>
                {/* Visible, not left to the title tooltip on the option
                    itself -- most people never hover to find it. */}
                {selectedType?.description && (
                  <div className={`${CLASSNAME}-group-description`}>
                    {selectedType.description}
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
      )}
    </EditorCard>
  );
};

export default ImageLabelsClassification;
