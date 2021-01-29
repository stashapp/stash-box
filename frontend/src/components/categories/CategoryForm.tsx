import React from "react";
import { useHistory, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form } from "react-bootstrap";

import { Category_findTagCategory as Category } from "src/definitions/Category";
import {
  TagGroupEnum,
  TagCategoryCreateInput,
} from "src/definitions/globalTypes";

const groups = Object.keys(TagGroupEnum);

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  description: yup.string(),
  group: yup.mixed().oneOf(groups).required("Group is required"),
});

type CategoryFormData = yup.InferType<typeof schema>;

interface TagProps {
  id?: string;
  category?: Category;
  callback: (data: TagCategoryCreateInput) => void;
}

const TagForm: React.FC<TagProps> = ({ id, category, callback }) => {
  const history = useHistory();
  const { register, handleSubmit, errors } = useForm<CategoryFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: CategoryFormData) => {
    const callbackData: TagCategoryCreateInput = {
      name: data.name,
      description: data.description ?? null,
      group: data.group as TagGroupEnum,
    };
    callback(callbackData);
  };

  return (
    <Form className="TagForm col-6" onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="name">
        <Form.Label>Name</Form.Label>
        <input
          type="text"
          className={cx("form-control", { "is-invalid": errors.name })}
          placeholder="Name"
          name="name"
          defaultValue={category?.name ?? ""}
          ref={register({ required: true })}
        />
        <div className="invalid-feedback">{errors?.name?.message}</div>
      </Form.Group>

      <Form.Group controlId="description">
        <Form.Label>Description</Form.Label>
        <Form.Control
          name="description"
          placeholder="Description"
          defaultValue={category?.description ?? ""}
          ref={register}
        />
      </Form.Group>

      <Form.Group>
        <Form.Label>Group</Form.Label>
        <Form.Control
          name="group"
          as="select"
          defaultValue={category?.group ?? TagGroupEnum.ACTION}
          ref={register}
        >
          {groups.map((g) => (
            <option value={g} key={g}>{`${g
              .charAt(0)
              .toUpperCase()}${g.toLowerCase().slice(1)}`}</option>
          ))}
        </Form.Control>
      </Form.Group>

      <Form.Group className="d-flex">
        <Button type="submit" className="col-2">
          Save
        </Button>
        <Button type="reset" className="ml-auto mr-2">
          Reset
        </Button>
        <Link to={id ? `/categories/${id}` : "/categories"}>
          <Button variant="danger" onClick={() => history.goBack()}>
            Cancel
          </Button>
        </Link>
      </Form.Group>
    </Form>
  );
};

export default TagForm;
