import cx from "classnames";
import { useId, useMemo } from "react";
import { Form } from "react-bootstrap";

import { EditorCard, Tooltip } from "src/components/fragments";
import type { ImageTypeEnum, ImageTypeGroupsQuery } from "src/graphql";

import type { Labelling } from "./types";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];
type ImageType = ImageTypeGroup["types"][number];

interface Props<T extends Labelling> {
  groups: ImageTypeGroup[];
  value: T;
  onChange: (value: T) => void;
  labelsDisabled?: boolean;
}

const CLASSNAME = "ImageLabels";

/** The type-picking half of ImageLabels. */
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

  // Which chosen type blocks a value via conflicts_with
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

  if (labelsDisabled && value.types.length === 0) return null;

  return (
    <EditorCard heading="Classification">
      {labelsDisabled ? (
        // A readout rather than disabled controls
        <div
          className={`${CLASSNAME}-summary`}
          title="You do not have permission to change this"
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
            // A switched-off type stays visible while this image carries it, but is not offered from a blank group
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
                  <Form.Group
                    controlId={`${idPrefix}-${group.key}-none`}
                    className={cx(
                      `${CLASSNAME}-option`,
                      `${CLASSNAME}-option-none`,
                      {
                        [`${CLASSNAME}-option-selected`]: !selected,
                      },
                    )}
                  >
                    <Form.Label title="It's always valid to leave an image unlabeled">
                      <Form.Check
                        type="radio"
                        name={`${idPrefix}-${group.key}`}
                        checked={!selected}
                        onChange={() => chooseType(group.key, null)}
                      />
                      <span>None</span>
                    </Form.Label>
                  </Form.Group>
                  {offered.map((type) => {
                    const blocker =
                      type.key === selected
                        ? undefined
                        : blockedBy.get(type.key);
                    // A disabled radio swallows the hover a native title needs
                    const hint = blocker
                      ? `Conflicts with "${blocker.name}"`
                      : (type.description ?? "");
                    return (
                      <Form.Group
                        key={type.key}
                        controlId={`${idPrefix}-${type.key}`}
                        className={cx(`${CLASSNAME}-option`, {
                          [`${CLASSNAME}-option-selected`]:
                            type.key === selected,
                          [`${CLASSNAME}-option-blocked`]: !!blocker,
                        })}
                      >
                        <Tooltip text={hint} placement="top">
                          <Form.Label>
                            <Form.Check
                              type="radio"
                              name={`${idPrefix}-${group.key}`}
                              checked={type.key === selected}
                              disabled={!!blocker}
                              onChange={() => chooseType(group.key, type.key)}
                            />
                            <span>{type.name}</span>
                          </Form.Label>
                        </Tooltip>
                      </Form.Group>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
      )}
    </EditorCard>
  );
};

export default ImageLabelsClassification;
