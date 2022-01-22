import { FC } from "react";
import { useHistory } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import { Button, Form } from "react-bootstrap";
import Select from "react-select";
import { groupBy, sortBy } from "lodash-es";

import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";
import { useCategories, TagEditDetailsInput } from "src/graphql";

import { EditNote } from "src/components/form";
import { LoadingIndicator } from "src/components/fragments";
import MultiSelect from "src/components/multiSelect";

import { TagSchema, TagFormData } from "./schema";

interface TagProps {
  tag: Tag;
  callback: (data: TagEditDetailsInput, editNote: string) => void;
  saving: boolean;
}

const TagForm: FC<TagProps> = ({ tag, callback, saving }) => {
  const history = useHistory();
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<TagFormData>({
    resolver: yupResolver(TagSchema),
    defaultValues: {
      name: tag.name,
      description: tag.description ?? "",
      aliases: tag.aliases,
      categoryId: tag.category?.id || null,
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
      category_id: data.categoryId,
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
          render={({ field: { onChange, value } }) => (
            <MultiSelect
              values={value}
              onChange={onChange}
              placeholder="Enter name..."
            />
          )}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Category</Form.Label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              classNamePrefix="react-select"
              className={cx({ "is-invalid": errors.categoryId })}
              onChange={(opt) => onChange(opt?.value || null)}
              options={categoryObj}
              isClearable
              placeholder="Category"
              defaultValue={categories.find((s) => s.value === value)}
            />
          )}
        />
        <div className="invalid-feedback">{errors?.categoryId?.message}</div>
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
        <Button variant="danger" onClick={() => history.goBack()}>
          Cancel
        </Button>
      </Form.Group>
    </Form>
  );
};

export default TagForm;
