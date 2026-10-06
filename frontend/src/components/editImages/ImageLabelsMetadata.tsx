import cx from "classnames";
import { useId, useState } from "react";
import { Form } from "react-bootstrap";

import { EditorCard } from "src/components/fragments";
import { maxImageDate, partialDateError } from "src/utils";

import type { Labelling } from "./types";

interface Props<T extends Labelling> {
  value: T;
  onChange: (value: T) => void;
  dateDisabled?: boolean;
}

const CLASSNAME = "ImageLabels";

/** The date half of ImageLabels. */
const ImageLabelsMetadata = <T extends Labelling>({
  value,
  onChange,
  dateDisabled = false,
}: Props<T>) => {
  const idPrefix = useId();
  const [dateFocused, setDateFocused] = useState(false);
  const dateError = dateFocused
    ? undefined
    : partialDateError(value.date, maxImageDate());

  if (dateDisabled && !value.date) return null;

  return (
    <EditorCard heading="Approximate date">
      {dateDisabled ? (
        <div
          className={`${CLASSNAME}-summary`}
          title="You do not have permission to change this"
        >
          {value.date && (
            <span className={`${CLASSNAME}-summary-item`}>{value.date}</span>
          )}
        </div>
      ) : (
        <Form.Group
          controlId={`${idPrefix}-date`}
          className={`${CLASSNAME}-date-group`}
        >
          <Form.Label className="visually-hidden">Image date</Form.Label>
          <Form.Control
            type="text"
            className={cx({ "is-invalid": dateError })}
            value={value.date ?? ""}
            placeholder="YYYY-MM-DD"
            onFocus={() => setDateFocused(true)}
            onBlur={() => setDateFocused(false)}
            onChange={(e) =>
              onChange({ ...value, date: e.currentTarget.value || null })
            }
          />
          <Form.Control.Feedback type="invalid">
            {dateError}
          </Form.Control.Feedback>
          <Form.Text>Leave blank if uncertain.</Form.Text>
        </Form.Group>
      )}
    </EditorCard>
  );
};

export default ImageLabelsMetadata;
