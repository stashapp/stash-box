import type React from "react";
import { useId, useState } from "react";
import { Form } from "react-bootstrap";

import { EditorCard } from "src/components/fragments";
import { maxImageDate, partialDateError } from "src/utils";

import type { ImageCategorization } from "./types";

interface Props {
  value: ImageCategorization;
  onChange: (value: ImageCategorization) => void;
  readOnly?: boolean;
}

const CLASSNAME = "ImageCategorizationFields";

const ImageDate: React.FC<Props> = ({ value, onChange, readOnly = false }) => {
  const idPrefix = useId();
  const [dateFocused, setDateFocused] = useState(false);
  const dateError = dateFocused
    ? undefined
    : partialDateError(value.date, maxImageDate());

  if (readOnly && !value.date) {
    return null;
  }

  return (
    <EditorCard heading="Approximate date">
      {readOnly ? (
        <div className={`${CLASSNAME}-summary`}>
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
            isInvalid={!!dateError}
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

export default ImageDate;
