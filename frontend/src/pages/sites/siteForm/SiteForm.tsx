import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import { capitalize } from "lodash-es";
import { type ChangeEvent, type FC, useState } from "react";
import { Button, Form } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  type SiteCreateInput,
  type SiteQuery,
  useLazyFetchSiteFavicons,
  useSiteCategories,
  ValidSiteTypeEnum,
} from "src/graphql";
import * as yup from "yup";

type Site = NonNullable<SiteQuery["findSite"]>;

const validSites = Object.keys(ValidSiteTypeEnum);

const parseMimeType = (dataURL: string) =>
  dataURL.match(/^data:([^;,]+)/)?.[1] ?? "unknown";

const schema = yup.object({
  name: yup.string().required("Name is required"),
  description: yup.string().optional(),
  url: yup.string().optional(),
  regex: yup.string().optional(),
  valid_types: yup
    .array(yup.string().oneOf(validSites).required())
    .min(1, "At least one site type is required")
    .ensure(),
  category_id: yup.number().nullable().optional(),
  highlighted: yup.boolean().default(true),
});

type SiteFormData = yup.Asserts<typeof schema>;

interface SiteProps {
  site?: Site;
  callback: (data: SiteCreateInput) => void;
}

const SiteForm: FC<SiteProps> = ({ site, callback }) => {
  const navigate = useNavigate();
  const { data: categoryData } = useSiteCategories();
  const {
    control,
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // null: favicon unchanged, "": cleared, otherwise a base64 data URL to store.
  const [favicon, setFavicon] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<
    { url: string; image: string }[]
  >([]);
  const [faviconError, setFaviconError] = useState<string>();
  // Pixel dimensions per candidate, read from each image once it loads.
  const [dimensions, setDimensions] = useState<Record<string, string>>({});
  const [fetchFavicons, { loading: fetchingFavicons }] =
    useLazyFetchSiteFavicons();

  const currentIcon = favicon === null ? (site?.icon ?? "") : favicon;

  const handleFetchFavicons = () => {
    setFaviconError(undefined);
    setCandidates([]);
    setDimensions({});
    fetchFavicons({ variables: { url: getValues("url") ?? "" } })
      .then((res) => {
        if (res.error) {
          setFaviconError(res.error.message);
          return;
        }
        const found = res.data?.fetchSiteFavicons ?? [];
        if (found.length === 0) setFaviconError("No favicons found");
        setCandidates(found.map(({ url, image }) => ({ url, image })));
      })
      .catch((e: unknown) => {
        setFaviconError(e instanceof Error ? e.message : "Failed to fetch");
      });
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.validity.valid && event.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = (e) =>
        e.target?.result && setFavicon(e.target.result as string);
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const categories = (
    categoryData?.querySiteCategories.site_categories ?? []
  ).map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const onSubmit = (data: SiteFormData) => {
    const callbackData: SiteCreateInput = {
      name: data.name,
      description: data.description,
      url: data.url,
      regex: data.regex,
      valid_types: data.valid_types as ValidSiteTypeEnum[],
      category_id: data.category_id ?? null,
      highlighted: data.highlighted,
      // Only send the favicon when it has been changed.
      favicon: favicon === null ? undefined : favicon,
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
          This regexp{" "}
          <code>(https?:\/\/(?:www\.)?(?:(.*)\.)?example\.org\/?[^?#]+)</code>
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

      <Form.Group className="mb-3">
        <Form.Label>Category</Form.Label>
        <Controller
          control={control}
          name="category_id"
          defaultValue={site?.category?.id ?? null}
          render={({ field: { onChange } }) => (
            <Select
              classNamePrefix="react-select"
              defaultValue={
                site?.category
                  ? { value: site.category.id, label: site.category.name }
                  : null
              }
              isClearable
              onChange={(option) => onChange(option?.value ?? null)}
              options={categories}
              placeholder="Category the site belongs to"
            />
          )}
        />
        <Form.Text>
          Optional category used to group links. Uncategorized sites are shown
          under &ldquo;Other&rdquo;.
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="highlighted" className="mb-3">
        <Form.Check
          type="switch"
          label="Highlight links"
          defaultChecked={site?.highlighted ?? true}
          {...register("highlighted")}
        />
        <Form.Text>
          Highlighted sites are shown as icons on performer, scene, and studio
          pages. Other sites only appear in the links section.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Favicon</Form.Label>
        <div className="d-flex align-items-center gap-2 mb-2">
          {currentIcon ? (
            <img src={currentIcon} alt="" width={24} height={24} />
          ) : (
            <span className="text-muted">No favicon</span>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleFetchFavicons}
            disabled={fetchingFavicons}
          >
            {fetchingFavicons ? "Fetching…" : "Fetch favicons"}
          </Button>
          {currentIcon && (
            <Button
              type="button"
              size="sm"
              variant="outline-danger"
              onClick={() => {
                setFavicon("");
                setCandidates([]);
              }}
            >
              Remove
            </Button>
          )}
          <Form.Control
            type="file"
            size="sm"
            className="w-auto ms-auto"
            onChange={onFileChange}
            accept=".ico,.png,.jpg,.jpeg,.webp,.svg,.gif"
          />
        </div>

        {faviconError && (
          <div className="text-danger small mb-2">{faviconError}</div>
        )}

        {candidates.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-2">
            {candidates.map((candidate) => (
              <button
                type="button"
                key={candidate.url}
                className={cx(
                  "btn btn-outline-secondary d-flex flex-column align-items-center p-2",
                  { active: favicon === candidate.image },
                )}
                title={candidate.url}
                onClick={() => setFavicon(candidate.image)}
              >
                <img
                  src={candidate.image}
                  alt=""
                  width={32}
                  height={32}
                  onLoad={(e) => {
                    const { naturalWidth, naturalHeight } = e.currentTarget;
                    setDimensions((d) => ({
                      ...d,
                      [candidate.url]: `${naturalWidth}×${naturalHeight}`,
                    }));
                  }}
                />
                <span className="small text-muted mt-1">
                  {parseMimeType(candidate.image)}
                  {dimensions[candidate.url]
                    ? ` · ${dimensions[candidate.url]}`
                    : ""}
                </span>
              </button>
            ))}
          </div>
        )}

        <Form.Text>
          Fetch favicons from the site URL, or upload a custom icon.
        </Form.Text>
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
