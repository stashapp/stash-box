import React, { useEffect } from "react";
import { useHistory, Link } from "react-router-dom";
import useForm from "react-hook-form";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form } from "react-bootstrap";

import { Tag_findTag as Tag } from "src/definitions/Tag";
import { TagCreateInput } from "src/definitions/globalTypes";
import MultiSelect from "src/components/multiSelect";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  description: yup.string(),
  aliases: yup.array().of(yup.string()),
});

type TagFormData = yup.InferType<typeof schema>;

interface TagProps {
  tag: Tag;
  callback: (data: TagCreateInput) => void;
}

const TagForm: React.FC<TagProps> = ({ tag, callback }) => {
  const history = useHistory();
  const { register, handleSubmit, setValue, errors } = useForm<TagFormData>({
    validationSchema: schema,
  });

  useEffect(() => {
    register({ name: "aliases" });
    setValue("aliases", tag.aliases);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, setValue]);

  const onSubmit = (data: TagFormData) => {
    const callbackData: TagCreateInput = {
      name: data.name,
      description: data.description ?? null,
      aliases: data.aliases ?? [],
    };
    callback(callbackData);
  };

  const handleAliasChange = (newAliases: string[]) =>
    setValue("aliases", newAliases);

  return (
    <Form className="TagForm col-6" onSubmit={handleSubmit(onSubmit)}>
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
        <Form.Label>Aliases</Form.Label>
        <MultiSelect values={tag.aliases} onChange={handleAliasChange} />
      </Form.Group>

      <Form.Group className="d-flex">
        <Button type="submit" className="col-2">
          Save
        </Button>
        <Button type="reset" className="ml-auto mr-2">
          Reset
        </Button>
        <Link to={tag.id ? `/tags/${tag.id}` : "/tags"}>
          <Button variant="danger" onClick={() => history.goBack()}>
            Cancel
          </Button>
        </Link>
      </Form.Group>
    </Form>
  );
};

export default TagForm;
