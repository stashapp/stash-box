import React, { useEffect, useState } from "react";
import { useHistory, Link } from "react-router-dom";
import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers";
import * as yup from "yup";
import cx from "classnames";

import { Studio_findStudio as Studio } from "src/definitions/Studio";
import { StudioCreateInput } from "src/definitions/globalTypes";

import { getUrlByType, Image } from "src/utils/transforms";
import EditImages from "../editImages";

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;

const schema = yup.object().shape({
  title: yup.string().required("Title is required"),
  url: yup.string().url("Invalid URL").transform(nullCheck).nullable(),
  photoURL: yup.string().url("Invalid URL").transform(nullCheck).nullable(),
  images: yup
    .array()
    .of(
      yup.object().shape({
        id: yup.string().required(),
        url: yup.string(),
      })
    )
    .nullable(),
});

type StudioFormData = yup.InferType<typeof schema>;

interface StudioProps {
  studio: Studio;
  callback: (data: StudioCreateInput) => void;
}

const StudioForm: React.FC<StudioProps> = ({ studio, callback }) => {
  const history = useHistory();
  const { register, handleSubmit, setValue, errors } = useForm<StudioFormData>({
    resolver: yupResolver(schema),
  });
  const [photoURL, setPhotoURL] = useState(getUrlByType(studio.urls, "PHOTO"));
  const [images, setImages] = useState<Image[]>(studio.images);

  const onURLChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPhotoURL(e.currentTarget.value);

  useEffect(() => {
    register({ name: "images" });
    setValue("images", images);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, setValue]);

  const onSubmit = (data: StudioFormData) => {
    const urls = [];
    if (data.url) urls.push({ url: data.url, type: "HOME" });
    if (data.photoURL) urls.push({ url: data.photoURL, type: "PHOTO" });
    const callbackData: StudioCreateInput = {
      name: data.title,
      urls,
      image_ids: (data.images ?? []).map((i) => i.id),
    };
    callback(callbackData);
  };

  const onSetImages = (i: Image[]) => {
    setImages(i);
    setValue("images", i);
  };

  return (
    <Form className="StudioForm" onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group row">
        <div className="col-3">
          <label htmlFor="title">
            <div>Name</div>
            <input
              className={cx("form-control", { "is-invalid": errors.title })}
              type="text"
              placeholder="Title"
              name="title"
              defaultValue={studio.name}
              ref={register({ required: true })}
            />
            <div className="invalid-feedback">{errors?.title?.message}</div>
          </label>
        </div>
        <div className="col-3">
          <label htmlFor="url">
            <div>Studio URL</div>
            <input
              className={cx("form-control", { "is-invalid": errors.url })}
              type="text"
              placeholder="URL"
              name="url"
              defaultValue={getUrlByType(studio.urls, "HOME")}
              ref={register}
            />
            <div className="invalid-feedback">{errors?.url?.message}</div>
          </label>
        </div>
        <div className="col-3">
          <label htmlFor="photoURL">
            <div>Photo URL</div>
            <input
              type="url"
              className={cx("form-control", { "is-invalid": errors.photoURL })}
              name="photoURL"
              onChange={onURLChange}
              defaultValue={getUrlByType(studio.urls, "PHOTO")}
              ref={register}
            />
            <div className="invalid-feedback">{errors?.photoURL?.message}</div>
          </label>
        </div>
      </div>

      {photoURL ? (
        <img src={photoURL} alt="Studio" className="StudioForm-img m-4" />
      ) : undefined}

      <Form.Group>
        <Form.Label>Images</Form.Label>
        <EditImages images={images} onImagesChanged={onSetImages} />
      </Form.Group>

      <Form.Group className="d-flex">
        <Button className="col-2" type="submit">
          Save
        </Button>
        <Button type="reset" variant="secondary" className="ml-auto mr-2">
          Reset
        </Button>
        <Link to={studio.id ? `/studios/${studio.id}` : "/studios"}>
          <Button variant="danger" onClick={() => history.goBack()}>
            Cancel
          </Button>
        </Link>
      </Form.Group>
    </Form>
  );
};

export default StudioForm;
