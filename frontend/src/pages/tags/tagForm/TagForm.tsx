import React, { useEffect } from "react";
import { useHistory, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form } from "react-bootstrap";
import Select, { ValueType, OptionTypeBase } from "react-select";

import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";
import { useCategories, TagEditDetailsInput } from "src/graphql";

import { LoadingIndicator } from "src/components/fragments";
import MultiSelect from "src/components/multiSelect";
import { createHref, tagHref } from "src/utils";
import { ROUTE_TAGS } from "src/constants/route";

interface IOptionType extends OptionTypeBase {
  value: string;
  label: string;
}

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;

const schema = yup.object().shape({
  name: yup.string().required("Name is required"),
  description: yup.string(),
  aliases: yup.array().of(yup.string()),
  categoryId: yup.string().transform(nullCheck).nullable(),
});

type TagFormData = yup.InferType<typeof schema>;

interface TagProps {
  tag: Tag;
  callback: (data: TagEditDetailsInput) => void;
}

const TagForm: React.FC<TagProps> = ({ tag, callback }) => {
  const history = useHistory();
  const { register, handleSubmit, setValue, errors } = useForm<TagFormData>({
    resolver: yupResolver(schema),
  });

  const { loading: loadingCategories, data: categories } = useCategories();

  useEffect(() => {
    register({ name: "categoryId" });
    register({ name: "aliases" });
    setValue("aliases", tag.aliases);
    if (tag?.category?.id) setValue("categoryId", tag.category.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, setValue]);

  if (loadingCategories)
    return <LoadingIndicator message="Loading tag categories..." />;

  const onCategoryChange = (selectedOption: ValueType<IOptionType>) =>
    setValue("categoryId", (selectedOption as IOptionType).value);

  const onSubmit = (data: TagFormData) => {
    const callbackData: TagEditDetailsInput = {
      name: data.name,
      description: data.description ?? null,
      aliases: data.aliases ?? [],
      category_id: data.categoryId,
    };
    callback(callbackData);
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
        <Select
          classNamePrefix="react-select"
          className={cx({ "is-invalid": errors.categoryId })}
          name="categoryId"
          onChange={onCategoryChange}
          options={[{ value: "", label: "None" }, ...categoryObj]}
          placeholder="Category"
          defaultValue={
            tag?.category?.id
              ? categoryObj.find((s) => s.value === tag.category?.id)
              : { label: "None", value: "" }
          }
        />
        <div className="invalid-feedback">{errors?.categoryId?.message}</div>
      </Form.Group>

      <Form.Group className="d-flex">
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
