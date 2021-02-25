import React from 'react';
import { Form } from 'react-bootstrap';
import cx from 'classnames';
import { FieldError } from 'react-hook-form';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  error?: FieldError;
}

const EditNote: React.FC<Props> = ({ register, error }) => (
    <Form.Group>
      <Form.Label>Edit Note</Form.Label>
      <Form.Control
        as="textarea"
        name="note"
        className={cx({ "is-invalid": error })}
        ref={register}
      />
      <Form.Text>
        Please add any relevant sources or other supporting information
        for your edit.
      </Form.Text>
      <Form.Control.Feedback type="invalid">
        {error?.message}
      </Form.Control.Feedback>
    </Form.Group>
);

export default EditNote;
