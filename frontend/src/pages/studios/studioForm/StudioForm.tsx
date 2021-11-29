import { FC, useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import cx from "classnames";

import { Studio_findStudio as Studio } from "src/graphql/definitions/Studio";
import { StudioEditDetailsInput } from "src/graphql";
import StudioSelect from "src/components/studioSelect";
import EditImages from "src/components/editImages";
import { getUrlByType, createHref } from "src/utils";
import { ROUTE_STUDIOS, ROUTE_STUDIO } from "src/constants/route";
import { EditNote } from "src/components/form";

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;

const schema = yup.object({
  title: yup.string().required("Title is required"),
  url: yup.string().url("Invalid URL").transform(nullCheck).nullable(),
  images: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        url: yup.string().required(),
      })
    )
    .required(),
  studio: yup
    .object({
      id: yup.string().required(),
      name: yup.string().required(),
    })
    .nullable(),
  note: yup.string().required("Edit note is required"),
});

type StudioFormData = yup.Asserts<typeof schema>;

interface StudioProps {
  studio: Studio;
  callback: (data: StudioEditDetailsInput, editNote: string) => void;
  showNetworkSelect?: boolean;
  saving: boolean;
}

const StudioForm: FC<StudioProps> = ({
  studio,
  callback,
  showNetworkSelect = true,
  saving,
}) => {
  const history = useHistory();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<StudioFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: studio.name,
      studio: studio.parent,
      images: studio.images,
    },
  });

  const [file, setFile] = useState<File | undefined>();

  const onSubmit = (data: StudioFormData) => {
    const urls = [];
    if (data.url) urls.push({ url: data.url, type: "HOME" });
    const callbackData: StudioEditDetailsInput = {
      name: data.title,
      urls,
      image_ids: data.images.map((i) => i.id),
      parent_id: data.studio?.id,
    };
    callback(callbackData, data.note);
  };

  return (
    <Form className="StudioForm" onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="name" className="mb-3">
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

      <Form.Group controlId="url" className="mb-3">
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
        <Form.Group controlId="network" className="mb-3">
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

      <Form.Group className="mb-3">
        <Form.Label>Images</Form.Label>
        <EditImages
          control={control}
          maxImages={1}
          file={file}
          setFile={(f) => setFile(f)}
        />
      </Form.Group>

      <EditNote register={register} error={errors.note} />

      <Form.Group className="mb-3">
        <div className="d-flex">
          <Button type="submit" disabled={!!file || saving}>
            Submit Edit
          </Button>
          <Button type="reset" variant="secondary" className="ms-auto me-2">
            Reset
          </Button>
          <Link
            to={createHref(studio.id ? ROUTE_STUDIO : ROUTE_STUDIOS, studio)}
          >
            <Button variant="danger" onClick={() => history.goBack()}>
              Cancel
            </Button>
          </Link>
        </div>
        {/* dummy element for feedback */}
        <span className={file ? "is-invalid" : ""} />
        <Form.Control.Feedback type="invalid">
          Upload or remove image to continue.
        </Form.Control.Feedback>
      </Form.Group>
    </Form>
  );
};

export default StudioForm;
