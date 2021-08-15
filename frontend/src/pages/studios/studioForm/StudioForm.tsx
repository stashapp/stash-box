import React from "react";
import { useHistory, Link } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import cx from "classnames";

import { Studio_findStudio as Studio } from "src/graphql/definitions/Studio";
import { StudioCreateInput } from "src/graphql";
import StudioSelect from "src/components/studioSelect";
import EditImages from "src/components/editImages";
import { getUrlByType, createHref } from "src/utils";
import { ROUTE_STUDIOS, ROUTE_STUDIO } from "src/constants/route";

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;

const schema = yup.object({
  title: yup.string().required("Title is required"),
  url: yup.string().url("Invalid URL").transform(nullCheck).nullable(),
  images: yup
    .array()
    .of(yup.string().trim().transform(nullCheck).required())
    .transform((_, obj) => Object.keys(obj ?? [])),
  studio: yup.string().nullable(),
});

type StudioFormData = yup.Asserts<typeof schema>;

interface StudioProps {
  studio: Studio;
  callback: (data: StudioCreateInput) => void;
  showNetworkSelect?: boolean;
}

const StudioForm: React.FC<StudioProps> = ({
  studio,
  callback,
  showNetworkSelect = true,
}) => {
  const history = useHistory();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StudioFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: StudioFormData) => {
    const urls = [];
    if (data.url) urls.push({ url: data.url, type: "HOME" });
    const callbackData: StudioCreateInput = {
      name: data.title,
      urls,
      image_ids: data.images,
      parent_id: data.studio,
    };
    callback(callbackData);
  };

  return (
    <Form className="StudioForm" onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="name">
        <Form.Label>Name</Form.Label>
        <Form.Control
          className={cx({ "is-invalid": errors.title })}
          placeholder="Title"
          defaultValue={studio.name}
          {...register("title")}
        />
        <Form.Control.Feedback type="invalid">
          {errors?.title?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group controlId="url">
        <Form.Label>URL</Form.Label>
        <Form.Control
          className={cx({ "is-invalid": errors.url })}
          placeholder="URL"
          defaultValue={getUrlByType(studio.urls, "HOME")}
          {...register("url")}
        />
        <Form.Control.Feedback type="invalid">
          {errors?.url?.message}
        </Form.Control.Feedback>
      </Form.Group>

      {showNetworkSelect && (
        <Form.Group controlId="network">
          <Form.Label>Network</Form.Label>
          <StudioSelect
            excludeStudio={studio.id}
            control={control}
            initialStudio={studio.parent}
            isClearable
            networkSelect
          />
        </Form.Group>
      )}

      <Form.Group>
        <Form.Label>Images</Form.Label>
        <EditImages
          initialImages={studio.images}
          control={control}
          maxImages={1}
        />
      </Form.Group>

      <Form.Group className="d-flex">
        <Button className="col-2" type="submit">
          Save
        </Button>
        <Button type="reset" variant="secondary" className="ml-auto mr-2">
          Reset
        </Button>
        <Link to={createHref(studio.id ? ROUTE_STUDIO : ROUTE_STUDIOS, studio)}>
          <Button variant="danger" onClick={() => history.goBack()}>
            Cancel
          </Button>
        </Link>
      </Form.Group>
    </Form>
  );
};

export default StudioForm;
