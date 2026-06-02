import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import { groupBy, sortBy } from "lodash-es";
import type { FC } from "react";
import { Button, Form } from "react-bootstrap";
import { Controller, type FieldError, useForm } from "react-hook-form";
import Select from "react-select";
import { EditNote } from "src/components/form";
import { LoadingIndicator } from "src/components/fragments";
import MergeConflicts from "src/components/mergeConflicts";
import MultiSelect from "src/components/multiSelect";
import {
  type TagFragment as Tag,
  type TagEditDetailsInput,
  useCategories,
} from "src/graphql";
import { useBeforeUnload } from "src/hooks/useBeforeUnload";
import type { TagMergeConflict } from "./merge";
import { type TagFormData, TagSchema } from "./schema";
import type { InitialTag } from "./types";

interface TagProps {
  tag?: Tag | null;
  callback: (data: TagEditDetailsInput, editNote: string) => void;
  initial?: InitialTag;
  conflicts?: TagMergeConflict[];
  saving: boolean;
}

const TagForm: FC<TagProps> = ({
  tag,
  callback,
  initial,
  conflicts,
  saving,
}) => {
  useBeforeUnload();
  const initialAliases = initial?.aliases ?? tag?.aliases ?? [];
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(TagSchema),
    defaultValues: {
      name: initial?.name ?? tag?.name ?? "",
      description: initial?.description ?? tag?.description ?? "",
      aliases: initialAliases,
      category: initial?.category ?? tag?.category,
    },
  });

  const fieldData = watch();

  const { loading: loadingCategories, data: categoryData } = useCategories();

  if (loadingCategories)
    return <LoadingIndicator message="Loading tag categories..." />;

  const onSubmit = (data: TagFormData) => {
    const callbackData: TagEditDetailsInput = {
      name: data.name,
      description: data.description?.trim() || null,
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
      {conflicts && conflicts.length > 0 && (
        <MergeConflicts
          conflicts={conflicts}
          values={fieldData}
          onSelect={(field, value) =>
            // RHF cannot infer the value type from a dynamic field name.
            setValue(field, value as never, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
        />
      )}
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
        <Form.Label htmlFor="tag-aliases-select">Aliases</Form.Label>
        <Controller
          name="aliases"
          control={control}
          render={({ field: { onChange } }) => (
            <MultiSelect
              initialValues={initialAliases}
              onChange={onChange}
              placeholder="Enter name..."
              inputId="tag-aliases-select"
            />
          )}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="tag-category-select">Category</Form.Label>
        <Controller
          name="category"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              inputId="tag-category-select"
              classNamePrefix="react-select"
              className={cx({ "is-invalid": errors.category })}
              onChange={(opt) =>
                onChange(opt ? { id: opt.value, name: opt.label } : null)
              }
              options={categoryObj}
              isClearable
              placeholder="Category"
              value={
                value
                  ? (categories.find((s) => s.value === value.id) ?? null)
                  : null
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
        <Button variant="danger" onClick={() => history.back()}>
          Cancel
        </Button>
      </Form.Group>
    </Form>
  );
};

export default TagForm;
