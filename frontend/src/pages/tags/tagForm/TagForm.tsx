import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller, FieldError } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import { Button, Form } from "react-bootstrap";
import Select from "react-select";
import { groupBy, sortBy } from "lodash-es";

import {
  useCategories,
  TagEditDetailsInput,
  TagFragment as Tag,
} from "src/graphql";

import { EditNote } from "src/components/form";
import { LoadingIndicator } from "src/components/fragments";
import MultiSelect from "src/components/multiSelect";

import { TagSchema, TagFormData } from "./schema";
import { InitialTag } from "./types";
import { NativeBeforeUnload } from "src/utils/beforeUnload";

interface TagProps {
  tag?: Tag | null;
  callback: (data: TagEditDetailsInput, editNote: string) => void;
  initial?: InitialTag;
  saving: boolean;
}

const TagForm: FC<TagProps> = ({ tag, callback, initial, saving }) => {
  NativeBeforeUnload();
  const navigate = useNavigate();
  const initialAliases = initial?.aliases ?? tag?.aliases ?? [];
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<TagFormData>({
    resolver: yupResolver(TagSchema),
    defaultValues: {
      name: initial?.name ?? tag?.name ?? "",
      description: initial?.description ?? tag?.description ?? "",
      aliases: initialAliases,
      category: initial?.category ?? tag?.category,
    },
  });

  const { loading: loadingCategories, data: categoryData } = useCategories();

  if (loadingCategories)
    return <LoadingIndicator message="Loading tag categories..." />;

  const onSubmit = (data: TagFormData) => {
    const callbackData: TagEditDetailsInput = {
      name: data.name,
      description: data.description ?? null,
      aliases: data.aliases ?? [],
      category_id: data.category?.id,
    };
    callback(callbackData, data.note);
  };

  const categories = (
    categoryData?.queryTagCategories.tag_categories ?? []
  ).map((cat) => ({
    label: cat.name,
    value: cat.id,
    group: cat.group,
  }));
  const grouped = groupBy(categories, (cat) => cat.group);
  const categoryObj = sortBy(Object.keys(grouped)).map((groupName) => ({
    label: groupName,
    options: sortBy(grouped[groupName], (cat) => cat.label),
  }));

  return (
    <Form className="TagForm w-50" onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="name" className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          className={cx({ "is-invalid": errors.name })}
          placeholder="Name"
          {...register("name")}
        />
        <div className="invalid-feedback">{errors?.name?.message}</div>
      </Form.Group>

      <Form.Group controlId="description" className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control placeholder="Description" {...register("description")} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Aliases</Form.Label>
        <Controller
          name="aliases"
          control={control}
          render={({ field: { onChange } }) => (
            <MultiSelect
              initialValues={initialAliases}
              onChange={onChange}
              placeholder="Enter name..."
            />
          )}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Category</Form.Label>
        <Controller
          name="category"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              classNamePrefix="react-select"
              className={cx({ "is-invalid": errors.category })}
              onChange={(opt) =>
                onChange(opt ? { id: opt.value, name: opt.label } : null)
              }
              options={categoryObj}
              isClearable
              placeholder="Category"
              defaultValue={
                value ? categories.find((s) => s.value === value.id) : null
              }
            />
          )}
        />
        <div className="invalid-feedback">
          {(errors?.category as FieldError | undefined)?.message}
        </div>
      </Form.Group>

      <EditNote register={register} error={errors.note} />

      <Form.Group className="d-flex mb-3">
        <Button type="submit" disabled className="d-none" aria-hidden="true" />
        <Button type="submit" disabled={saving}>
          Submit Edit
        </Button>
        <Button type="reset" className="ms-auto me-2">
          Reset
        </Button>
        <Button variant="danger" onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </Form.Group>
    </Form>
  );
};

export default TagForm;
