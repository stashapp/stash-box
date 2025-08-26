import type { FC } from "react";
import { Form } from "react-bootstrap";
import cx from "classnames";
import type { FieldError, UseFormRegister } from "react-hook-form";

import NoteInput from "./NoteInput";

interface Props {
  // biome-ignore lint/suspicious/noExplicitAny: Awkward react-hook-form type
  register: UseFormRegister<any>;
  error?: FieldError;
}

const EditNote: FC<Props> = ({ register, error }) => (
  <div className="mb-3">
    <Form.Label>Edit Note</Form.Label>
    <NoteInput
      className={cx({ "is-invalid": error })}
      register={register}
      hasError={!!error?.message}
    />
    <Form.Text>
      Please add any relevant sources or other supporting information for your
      edit.
    </Form.Text>
    <Form.Control.Feedback type="invalid">
      {error?.message}
    </Form.Control.Feedback>
  </div>
);

export default EditNote;
