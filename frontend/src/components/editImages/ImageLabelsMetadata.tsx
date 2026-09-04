import cx from "classnames";
import { useState } from "react";
import { Form } from "react-bootstrap";

import { EditorCard } from "src/components/fragments";
import { maxImageDate, partialDateError } from "src/utils";

import type { Labelling } from "./ImageLabels";

interface Props<T extends Labelling> {
  value: T;
  onChange: (value: T) => void;
  dateDisabled?: boolean;
}

const CLASSNAME = "EditImages-labels";

/**
 * The date half of ImageLabels, split out so a host can place it apart from
 * the type pickers. See ImageLabels for where the two are recombined.
 */
const ImageLabelsMetadata = <T extends Labelling>({
  value,
  onChange,
  dateDisabled = false,
}: Props<T>) => {
  // Withheld while the field is focused, so a date that is only half-typed
  // does not get flagged invalid on every keystroke -- shown once they
  // leave it, and hidden again the moment they come back to fix it
  const [dateFocused, setDateFocused] = useState(false);
  const dateError = dateFocused
    ? undefined
    : partialDateError(value.date, maxImageDate());

  return (
    <EditorCard className={`${CLASSNAME}-metadata`} heading="Approximate date">
      {dateDisabled ? (
        // Nothing here is actionable for this session -- MODERATE is
        // required to touch it -- so there is nothing to gain from a
        // disabled-but-still-an-input control, and a real cost: it still
        // looks like a text field to click into. A plain readout says what
        // the image carries without claiming that it can be changed.
        <div
          className={`${CLASSNAME}-summary`}
          title="Requires moderator to change"
        >
          {value.date && (
            <span className={`${CLASSNAME}-summary-item`}>{value.date}</span>
          )}
        </div>
      ) : (
        <>
          <div className={`${CLASSNAME}-date-group`}>
            <Form.Control
              type="text"
              className={cx(`${CLASSNAME}-date`, { "is-invalid": dateError })}
              value={value.date ?? ""}
              placeholder="YYYY-MM-DD"
              aria-label="Image date"
              onFocus={() => setDateFocused(true)}
              onBlur={() => setDateFocused(false)}
              onChange={(e) =>
                onChange({ ...value, date: e.currentTarget.value || null })
              }
            />
            <Form.Control.Feedback type="invalid">
              {dateError}
            </Form.Control.Feedback>
          </div>

          <Form.Text className={`${CLASSNAME}-hint`}>
            Leave blank if uncertain.
          </Form.Text>
        </>
      )}
    </EditorCard>
  );
};

export default ImageLabelsMetadata;
