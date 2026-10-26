import cx from "classnames";
import type React from "react";
import { useId } from "react";
import { Form } from "react-bootstrap";

import { EditorCard, Tooltip } from "src/components/fragments";
import type { ImageTypeEnum, ImageTypeGroupsQuery } from "src/graphql";

import type { ImageCategorization } from "./types";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];

interface Props {
  groups: ImageTypeGroup[];
  value: ImageCategorization;
  onChange: (value: ImageCategorization) => void;
  readOnly?: boolean;
}

const CLASSNAME = "ImageCategorizationFields";

const ImageClassification: React.FC<Props> = ({
  groups,
  value,
  onChange,
  readOnly = false,
}) => {
  const idPrefix = useId();

  const types = groups.flatMap((group) => group.types);
  const selectedTypes = types.filter((type) => value.types.includes(type.key));

  const chooseType = (group: ImageTypeGroup, key: ImageTypeEnum | null) => {
    const types = value.types.filter(
      (key) => !group.types.some((type) => type.key === key),
    );

    if (key) {
      types.push(key);
    }

    onChange({ ...value, types });
  };

  return (
    <EditorCard heading="Classification">
      {readOnly ? (
        <div className={`${CLASSNAME}-summary`}>
          {groups.map((group) => {
            const type = group.types.find((type) =>
              value.types.includes(type.key),
            );
            if (
              !type &&
              (!group.enabled ||
                !group.types.some((candidate) => candidate.enabled))
            ) {
              return null;
            }
            return (
              <span key={group.key} className={`${CLASSNAME}-summary-item`}>
                <span className={`${CLASSNAME}-summary-group`}>
                  {group.name}:
                </span>{" "}
                {type?.name ?? "None"}
              </span>
            );
          })}
        </div>
      ) : (
        <div className={`${CLASSNAME}-groups`}>
          {groups.map((group) => {
            const selected = group.types.find((type) =>
              value.types.includes(type.key),
            );
            // Keep an assigned disabled type visible so it can still be removed.
            const offered = group.types.filter(
              (type) =>
                (group.enabled && type.enabled) || type.key === selected?.key,
            );
            if (offered.length === 0) {
              return null;
            }

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
                        onChange={() => chooseType(group, null)}
                      />
                      <span>None</span>
                    </Form.Label>
                  </Form.Group>
                  {offered.map((type) => {
                    const blocker =
                      type.key === selected?.key
                        ? undefined
                        : selectedTypes.find((selectedType) =>
                            type.conflicts_with.includes(selectedType.key),
                          );
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
                            type.key === selected?.key,
                          [`${CLASSNAME}-option-blocked`]: !!blocker,
                        })}
                      >
                        <Tooltip text={hint} placement="top">
                          <Form.Label>
                            <Form.Check
                              type="radio"
                              name={`${idPrefix}-${group.key}`}
                              checked={type.key === selected?.key}
                              disabled={!!blocker}
                              onChange={() => chooseType(group, type.key)}
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

export default ImageClassification;
