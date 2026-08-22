import cx from "classnames";
import { type FC, useMemo } from "react";
import { Form } from "react-bootstrap";
import Select, { type OnChangeValue } from "react-select";

import { TagLink } from "src/components/fragments";
import type { ImageTypeEnum, ImageTypeGroupsQuery } from "src/graphql";
import { maxImageDate, partialDateError } from "src/utils";

import type { TypedImage } from "./types";

type ImageTypeGroup = ImageTypeGroupsQuery["imageTypeGroups"][number];
type ImageType = ImageTypeGroup["types"][number];

interface ImageLabelsProps {
  groups: ImageTypeGroup[];
  value: TypedImage;
  onChange: (value: TypedImage) => void;
}

const CLASSNAME = "EditImages-labels";

interface Option {
  value: ImageTypeEnum;
  label: string;
  group: string;
  sublabel: string;
}

/**
 * The labels an image carries, as chips, plus one control to add another
 *
 * Groups are exclusive so for example picking a type like front view
 * will make this stop offering the side and back views
 */
const ImageLabels: FC<ImageLabelsProps> = ({ groups, value, onChange }) => {
  const { byKey, groupOf, rankOf, options } = useMemo(() => {
    const byKey = new Map<string, ImageType>();
    const groupOf = new Map<string, string>();
    const rankOf = new Map<string, number>();
    const options: { label: string; options: Option[] }[] = [];

    // The order the groups are offered in can be changed by admins
    for (const group of groups) {
      for (const type of group.types) {
        byKey.set(type.key, type);
        groupOf.set(type.key, group.key);
        rankOf.set(type.key, rankOf.size);
      }

      // If a type or type group have been disabled we
      // still allow it to stay on the image, but do not offer to add
      options.push({
        label: group.name,
        options: group.types
          .filter((type) => group.enabled && type.enabled)
          .map((type) => ({
            value: type.key,
            label: type.name,
            group: group.key,
            sublabel: type.description ?? "",
          })),
      });
    }

    return { byKey, groupOf, rankOf, options };
  }, [groups]);

  // Groups are exclusive, do not offer to add the "Face" label
  // if "Full body" label has already been added
  const unavailable = useMemo(() => {
    const blocked = new Set<string>();
    for (const chosen of value.types) {
      for (const conflict of byKey.get(chosen)?.conflicts_with ?? []) {
        blocked.add(conflict);
      }
    }
    return blocked;
  }, [value.types, byKey]);

  const answeredGroups = useMemo(
    () => new Set(value.types.map((type) => groupOf.get(type))),
    [value.types, groupOf],
  );

  const available = options
    .map((group) => ({
      ...group,
      options: group.options.filter(
        (option) =>
          !unavailable.has(option.value) && !answeredGroups.has(option.group),
      ),
    }))
    .filter((group) => group.options.length > 0);

  const addType = (result: OnChangeValue<Option, false>) => {
    if (!result) return;
    onChange({ ...value, types: [...value.types, result.value] });
  };

  const removeType = (key: ImageTypeEnum) =>
    onChange({ ...value, types: value.types.filter((type) => type !== key) });

  const dateError = partialDateError(value.date, maxImageDate());

  // Render labels in the server-defined order rather than the order in which they were added to the image
  const chosen = value.types
    .map((key) => byKey.get(key))
    .filter((type): type is ImageType => type !== undefined)
    .sort(
      (a, b) =>
        (rankOf.get(a.key) ?? Infinity) - (rankOf.get(b.key) ?? Infinity),
    );

  return (
    <div className={CLASSNAME}>
      <div className={`${CLASSNAME}-chips`}>
        {chosen.map((type) => (
          <TagLink
            key={type.key}
            title={type.name}
            description={type.description}
            onRemove={() => removeType(type.key)}
            disabled
          />
        ))}
      </div>

      <div className={`${CLASSNAME}-controls`}>
        <Select
          isMulti={false}
          classNamePrefix="react-select"
          className={`react-select ${CLASSNAME}-select`}
          options={available}
          value={null}
          onChange={addType}
          placeholder="Add label"
          aria-label="Add label"
          menuPlacement="top"
          controlShouldRenderValue={false}
          noOptionsMessage={() => "Nothing left to add"}
          formatOptionLabel={(option: Option) => (
            <div>
              <div className={`${CLASSNAME}-option`}>{option.label}</div>
              <div className={`${CLASSNAME}-option-description`}>
                {option.sublabel}
              </div>
            </div>
          )}
        />

        <Form.Control
          type="text"
          className={cx(`${CLASSNAME}-date`, { "is-invalid": dateError })}
          value={value.date ?? ""}
          placeholder="Image date"
          aria-label="Image date"
          title="When the image is from: 2019, 2019-06 or 2019-06-15"
          onChange={(e) =>
            onChange({ ...value, date: e.currentTarget.value || null })
          }
        />
        <Form.Control.Feedback type="invalid">
          {dateError}
        </Form.Control.Feedback>
      </div>
    </div>
  );
};

export default ImageLabels;
