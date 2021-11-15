import { FC } from "react";
import { useHistory, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form } from "react-bootstrap";

import { Category_findTagCategory as Category } from "src/graphql/definitions/Category";
import { TagGroupEnum, TagCategoryCreateInput } from "src/graphql";
import { createHref } from "src/utils";
import { ROUTE_CATEGORIES, ROUTE_CATEGORY } from "src/constants/route";

const groups = Object.keys(TagGroupEnum);

const schema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string(),
  group: yup.mixed().oneOf(groups).required("Group is required"),
});

type CategoryFormData = yup.Asserts<typeof schema>;

interface TagProps {
  id?: string;
  category?: Category;
  callback: (data: TagCategoryCreateInput) => void;
}

const TagForm: FC<TagProps> = ({ id, category, callback }) => {
  const history = useHistory();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
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
      <Form.Group controlId="name" className="mb-3">
        <Form.Label>Name</Form.Label>
        <input
          type="text"
          className={cx("form-control", { "is-invalid": errors.name })}
          placeholder="Name"
          {...register("name")}
          defaultValue={category?.name ?? ""}
        />
        <div className="invalid-feedback">{errors?.name?.message}</div>
      </Form.Group>

      <Form.Group controlId="description" className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          placeholder="Description"
          defaultValue={category?.description ?? ""}
          {...register("description")}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Group</Form.Label>
        <Form.Select
          defaultValue={category?.group ?? TagGroupEnum.ACTION}
          {...register("group")}
        >
          {groups.map((g) => (
            <option value={g} key={g}>{`${g.charAt(0).toUpperCase()}${g
              .toLowerCase()
              .slice(1)}`}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Group className="d-flex mb-3">
        <Button type="submit" className="col-2">
          Save
        </Button>
        <Button type="reset" className="ms-auto me-2">
          Reset
        </Button>
        <Link to={createHref(id ? ROUTE_CATEGORY : ROUTE_CATEGORIES, { id })}>
          <Button variant="danger" onClick={() => history.goBack()}>
            Cancel
          </Button>
        </Link>
      </Form.Group>
    </Form>
  );
};

export default TagForm;
