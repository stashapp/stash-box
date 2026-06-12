import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import type { FC } from "react";
import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import {
  ROUTE_SITE_CATEGORIES,
  ROUTE_SITE_CATEGORY,
} from "src/constants/route";

import type { SiteCategoryCreateInput, SiteCategoryQuery } from "src/graphql";
import { createHref } from "src/utils";
import * as yup from "yup";

type SiteCategory = NonNullable<SiteCategoryQuery["findSiteCategory"]>;

const schema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string(),
  sort_order: yup
    .number()
    .integer("Sort order must be a whole number")
    .typeError("Sort order must be a number")
    .default(0),
});

type SiteCategoryFormData = yup.Asserts<typeof schema>;

interface SiteCategoryProps {
  id?: number;
  category?: SiteCategory;
  callback: (data: SiteCategoryCreateInput) => void;
}

const SiteCategoryForm: FC<SiteCategoryProps> = ({
  id,
  category,
  callback,
}) => {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: SiteCategoryFormData) => {
    const callbackData: SiteCategoryCreateInput = {
      name: data.name,
      description: data.description ?? null,
      sort_order: data.sort_order,
    };
    callback(callbackData);
  };

  return (
    <Form className="SiteCategoryForm col-6" onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="name" className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          className={cx({ "is-invalid": errors.name })}
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

      <Form.Group controlId="sort_order" className="mb-3">
        <Form.Label>Sort order</Form.Label>
        <Form.Control
          type="number"
          className={cx({ "is-invalid": errors.sort_order })}
          defaultValue={category?.sort_order ?? 0}
          {...register("sort_order")}
        />
        <div className="invalid-feedback">{errors?.sort_order?.message}</div>
        <Form.Text>
          Categories are displayed in ascending sort order. Sites without a
          category are always shown last.
        </Form.Text>
      </Form.Group>

      <Form.Group className="d-flex mb-3">
        <Button type="submit" className="col-2">
          Save
        </Button>
        <Button type="reset" className="ms-auto me-2">
          Reset
        </Button>
        <Link
          to={createHref(id ? ROUTE_SITE_CATEGORY : ROUTE_SITE_CATEGORIES, {
            id,
          })}
        >
          <Button variant="danger" onClick={() => navigate(-1)}>
            Cancel
          </Button>
        </Link>
      </Form.Group>
    </Form>
  );
};

export default SiteCategoryForm;
