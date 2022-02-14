import { FC, useEffect } from "react";
import { useHistory, Link } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form } from "react-bootstrap";
import Select from "react-select";
import { groupBy, sortBy } from "lodash-es";

import { Tag_findTag as Tag } from "src/graphql/definitions/Tag";
import { useCategories, TagEditDetailsInput } from "src/graphql";

import { EditNote } from "src/components/form";
import { LoadingIndicator } from "src/components/fragments";
import MultiSelect from "src/components/multiSelect";
import { createHref, tagHref } from "src/utils";
import { ROUTE_TAGS } from "src/constants/route";

const schema = yup.object({
  name: yup.string().trim().required("Name is required"),
  description: yup.string().trim(),
  aliases: yup.array().of(yup.string().trim().required()),
  categoryId: yup.string().nullable().defined(),
  note: yup.string().required("Edit note is required"),
});

type TagFormData = yup.Asserts<typeof schema>;

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
    setValue,
    formState: { errors },
    control,
  } = useForm<TagFormData>({
    resolver: yupResolver(schema),
  });

  const { loading: loadingCategories, data: categoryData } = useCategories();

  useEffect(() => {
    register("aliases");
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
          defaultValue={tag.name}
          {...register("name", { required: true })}
        />
        <div className="invalid-feedback">{errors?.name?.message}</div>
      </Form.Group>

      <Form.Group controlId="description" className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          placeholder="Description"
          defaultValue={tag.description ?? ""}
          {...register("description")}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Aliases</Form.Label>
        <MultiSelect values={tag.aliases} onChange={handleAliasChange} />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Category</Form.Label>
        <Controller
          name="categoryId"
          control={control}
          defaultValue={tag.category?.id || null}
          render={({ field: { onChange, value } }) => (
            <Select
              classNamePrefix="react-select"
              className={cx({ "is-invalid": errors.categoryId })}
              name="categoryId"
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
