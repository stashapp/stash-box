import React, { useEffect } from "react";
import { useHistory, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form } from "react-bootstrap";
import Select from "react-select";

import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";
import { useCategories, TagEditDetailsInput } from "src/graphql";

import { EditNote } from 'src/components/form';
import { LoadingIndicator } from "src/components/fragments";
import MultiSelect from "src/components/multiSelect";
import { createHref, tagHref } from "src/utils";
import { ROUTE_TAGS } from "src/constants/route";

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  description: yup.string(),
  aliases: yup.array().of(yup.string().required()),
  categoryId: yup.string().nullable(),
  note: yup.string().required("Edit note is required"),
});

type TagFormData = yup.Asserts<typeof schema>;

interface TagProps {
  tag: Tag;
  callback: (data: TagEditDetailsInput, editNote: string) => void;
}

const TagForm: React.FC<TagProps> = ({ tag, callback }) => {
  const history = useHistory();
  const {
    register,
    handleSubmit,
    setValue,
    errors,
    control,
  } = useForm<TagFormData>({
    resolver: yupResolver(schema),
  });

  const { loading: loadingCategories, data: categories } = useCategories();

  useEffect(() => {
    register({ name: "aliases" });
    setValue("aliases", tag.aliases);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, setValue]);

  if (loadingCategories)
    return <LoadingIndicator message="Loading tag categories..." />;

  const onSubmit = (data: TagFormData) => {
    const callbackData: TagEditDetailsInput = {
      name: data.name,
      description: data.description ?? null,
      aliases: data.aliases ?? [],
      category_id: data.categoryId,
    };
    callback(callbackData, data.note);
  };

  const handleAliasChange = (newAliases: string[]) =>
    setValue("aliases", newAliases);

  const categoryObj = (
    categories?.queryTagCategories?.tag_categories ?? []
  ).map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <Form className="TagForm w-50" onSubmit={handleSubmit(onSubmit)}>
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

      <Form.Group>
        <Form.Label>Category</Form.Label>
        <Controller
          name="categoryId"
          control={control}
          defaultValue={tag.category?.id ?? null}
          render={({ onChange }) => (
            <Select
              classNamePrefix="react-select"
              className={cx({ "is-invalid": errors.categoryId })}
              name="categoryId"
              onChange={(opt) => opt && onChange(opt.value)}
              options={[{ value: "", label: "None" }, ...categoryObj]}
              placeholder="Category"
              defaultValue={
                tag?.category?.id
                  ? categoryObj.find((s) => s.value === tag.category?.id)
                  : { label: "None", value: "" }
              }
            />
          )}
        />
        <div className="invalid-feedback">{errors?.categoryId?.message}</div>
      </Form.Group>

      <EditNote register={register} error={errors.note} />

      <Form.Group className="d-flex">
        <Button
          type="submit"
          disabled
          className="d-none"
          aria-hidden="true"
        />
        <Button type="submit" className="col-2">
          Save
        </Button>
        <Button type="reset" className="ml-auto mr-2">
          Reset
        </Button>
        <Link to={tag.name ? tagHref(tag) : createHref(ROUTE_TAGS)}>
          <Button variant="danger" onClick={() => history.goBack()}>
            Cancel
          </Button>
        </Link>
      </Form.Group>
    </Form>
  );
};

export default TagForm;
