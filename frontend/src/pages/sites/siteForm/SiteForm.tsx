import { FC } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form } from "react-bootstrap";
import Select from "react-select";
import { capitalize } from "lodash-es";

import { ValidSiteTypeEnum, SiteCreateInput, SiteQuery } from "src/graphql";

type Site = NonNullable<SiteQuery["findSite"]>;

const validSites = Object.keys(ValidSiteTypeEnum);

const schema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string().optional(),
  url: yup.string().optional(),
  regex: yup.string().optional(),
  valid_types: yup
    .array(yup.string().oneOf(validSites).required())
    .min(1, "At least one site type is required")
    .ensure(),
});

type SiteFormData = yup.Asserts<typeof schema>;

interface SiteProps {
  site?: Site;
  callback: (data: SiteCreateInput) => void;
}

const SiteForm: FC<SiteProps> = ({ site, callback }) => {
  const navigate = useNavigate();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm < SiteFormData > ({
    resolver: yupResolver(schema),
  });

  const onSubmit = (data: SiteFormData) => {
    const callbackData: SiteCreateInput = {
      name: data.name,
      description: data.description,
      url: data.url,
      regex: data.regex,
      valid_types: data.valid_types as ValidSiteTypeEnum[],
    };
    callback(callbackData);
  };

  return (
    <Form className="SiteForm w-50" onSubmit={handleSubmit(onSubmit)}>
      <Form.Group controlId="name" className="mb-3">
        <Form.Label>Name</Form.Label>
        <Form.Control
          className={cx({ "is-invalid": errors.name })}
          placeholder="Name"
          defaultValue={site?.name ?? ""}
          {...register("name")}
        />
        <Form.Control.Feedback type="invalid">
          {errors?.name?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group controlId="description" className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          placeholder="Description"
          defaultValue={site?.description ?? ""}
          {...register("description")}
        />
      </Form.Group>

      <Form.Group controlId="url" className="mb-3">
        <Form.Label>URL</Form.Label>
        <Form.Control
          placeholder="URL"
          defaultValue={site?.url ?? ""}
          {...register("url")}
        />
        <Form.Text>URL of the site, if applicable.</Form.Text>
      </Form.Group>

      <Form.Group controlId="regex" className="mb-3">
        <Form.Label>Regular Expression</Form.Label>
        <Form.Control
          placeholder=""
          defaultValue={site?.regex ?? ""}
          {...register("regex")}
        />
        <Form.Text>
          An optional regular expression that will be used to clean links and
          autofill the Site selection with this Site. Must contain a capture
          group of the portion of the URL that will be kept.
          <br />
          Example:
          <br />
          This regexp <code>(https?:\/\/(?:www\.)?(?:(.*)\.)?example\.com\/?[^?#]+)</code>
          <br />
          will match this string{" "}
          <code>http://example.org/foo/bar?id=69#top</code>
          <br />
          and will clean it into <code>http://example.org/foo/bar</code>
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Valid link targets</Form.Label>
        <Controller
          control={control}
          name="valid_types"
          defaultValue={(site?.valid_types ?? []) as string[]}
          render={({ field: { onChange } }) => (
            <Select
              classNamePrefix="react-select"
              className={cx({ "is-invalid": errors.valid_types })}
              defaultValue={(site?.valid_types ?? []).map((s) => ({
                value: s as string,
                label: capitalize(s),
              }))}
              isMulti
              onChange={(values) => onChange(values.map((v) => v.value))}
              options={validSites.map((s) => ({
                value: s,
                label: capitalize(s),
              }))}
              placeholder="Types this site can link to"
            />
          )}
        />
        <Form.Control.Feedback type="invalid">
          {/* Workaround for typing error in react-hook-form */}
          {(errors.valid_types as unknown as { message: string })?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="d-flex mb-3">
        <Button type="submit" className="col-2">
          Save
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

export default SiteForm;
