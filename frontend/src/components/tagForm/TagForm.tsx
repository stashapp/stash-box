import React from "react";
import { Link } from "react-router-dom";
import useForm from "react-hook-form";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form } from "react-bootstrap";

import { Tag_findTag as Tag } from "src/definitions/Tag";
import { TagCreateInput } from "src/definitions/globalTypes";

const schema = yup.object().shape({
  name: yup.string(),
  description: yup.string(),
});

type TagFormData = yup.InferType<typeof schema>;

interface TagProps {
  tag: Tag;
  callback: (data: TagCreateInput) => void;
}

const TagForm: React.FC<TagProps> = ({ tag, callback }) => {
  const { register, handleSubmit, errors } = useForm<TagFormData>({
    validationSchema: schema,
  });

  const onSubmit = (data: TagFormData) => {
    const callbackData: TagCreateInput = {
      name: data.name,
      description: data.description ?? null,
    };
    callback(callbackData);
  };

  return (
    <Form className="StudioForm col-6" onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="name">
        <Form.Label>Name</Form.Label>
        <input
          type="text"
          className={cx("form-control", { "is-invalid": errors.name })}
          placeholder="Name"
          name="name"
          defaultValue={tag.name}
          ref={register({ required: true })}
        />
        <div className="invalid-feedback">{errors?.name?.message}</div>
      </Form.Group>

      <Form.Group controlId="description">
        <Form.Label>Description</Form.Label>
        <Form.Control
          name="description"
          placeholder="Description"
          defaultValue={tag.description ?? ""}
          ref={register}
        />
      </Form.Group>

      <Form.Group>
        <Button type="submit" className="col-2 mr-4">
          Save
        </Button>
        <Button type="reset" className="offset-6 mr-4">
          Reset
        </Button>
        <Link to={tag.id ? `/tags/${tag.id}` : "/tags"}>
          <button className="btn btn-danger mr-2" type="button">
            Cancel
          </button>
        </Link>
      </Form.Group>
    </Form>
  );
};

export default TagForm;
