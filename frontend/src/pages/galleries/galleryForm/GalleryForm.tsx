import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { useLens } from "@hookform/lenses";
import { yupResolver } from "@hookform/resolvers/yup";
import { type FC, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Form,
  InputGroup,
  Row,
  Tab,
  Tabs,
} from "react-bootstrap";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import EditImages from "src/components/editImages";
import { EditNote, NavButtons, SubmitButtons } from "src/components/form";
import { GenderIcon, Icon } from "src/components/fragments";
import SearchField, { SearchType } from "src/components/searchField";
import StudioSelect from "src/components/studioSelect";
import TagSelect from "src/components/tagSelect";
import URLInput from "src/components/urlInput";
import {
  type GalleryFragment as Gallery,
  type GalleryEditDetailsInput,
  type ImageFragment,
  ValidSiteTypeEnum,
} from "src/graphql";
import { useBeforeUnload } from "src/hooks/useBeforeUnload";
import { type GalleryFormData, GallerySchema } from "./schema";
import type { InitialGallery } from "./types";

type Props = {
  gallery?: Gallery | null;
  initial?: InitialGallery;
  callback: (input: GalleryEditDetailsInput, note: string) => void;
  saving: boolean;
  isCreate?: boolean;
};

const GalleryForm: FC<Props> = ({
  gallery,
  initial,
  callback,
  saving,
  isCreate = false,
}) => {
  useBeforeUnload();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(GallerySchema),
    mode: "onBlur",
    defaultValues: {
      title: initial?.title ?? gallery?.title ?? "",
      code:
        initial && "code" in initial ? initial.code : (gallery?.code ?? null),
      date: initial?.date ?? gallery?.date ?? "",
      photographer:
        initial && "photographer" in initial
          ? initial.photographer
          : (gallery?.photographer ?? null),
      details:
        initial && "details" in initial
          ? initial.details
          : (gallery?.details ?? null),
      studio: initial?.studio ?? gallery?.studio ?? undefined,
      performers: (initial?.performers ?? gallery?.performers ?? []).map(
        (appearance) => ({
          performerId: appearance.performer.id,
          name: appearance.performer.name,
          alias: appearance.as ?? "",
          aliases: appearance.performer.aliases,
          gender: appearance.performer.gender,
          disambiguation: appearance.performer.disambiguation,
          deleted: appearance.performer.deleted,
        }),
      ),
      scenes: initial?.scenes ?? gallery?.scenes ?? [],
      tags: initial?.tags ?? gallery?.tags ?? [],
      urls: initial?.urls ?? gallery?.urls ?? [],
      cover:
        initial && "cover" in initial
          ? initial.cover
            ? [initial.cover]
            : []
          : gallery?.cover
            ? [gallery.cover]
            : [],
      images: initial?.images ?? gallery?.images ?? [],
    },
  });
  const {
    fields: performers,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "performers",
    keyName: "key",
  });
  const {
    fields: scenes,
    append: appendScene,
    remove: removeScene,
  } = useFieldArray({ control, name: "scenes", keyName: "key" });
  const {
    fields: images,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control, name: "images", keyName: "key" });
  const lens = useLens({ control });
  const [activeTab, setActiveTab] = useState("details");
  const [coverFile, setCoverFile] = useState<File>();

  const metadataErrors = [
    { error: errors.title?.message, tab: "details" },
    { error: errors.date?.message, tab: "details" },
    {
      error:
        errors.studio?.message ||
        (errors.studio ? "Studio is required" : undefined),
      tab: "details",
    },
    {
      error: errors.urls?.find?.((url) => url?.url?.message)?.url?.message,
      tab: "links",
    },
    {
      error: errors.cover?.message,
      tab: "cover",
    },
    {
      error: errors.images?.find?.(
        (image) => image?.index?.message || image?.phash?.message,
      )
        ? "One or more gallery images has invalid metadata"
        : undefined,
      tab: "gallery-images",
    },
    { error: errors.note?.message, tab: "confirm" },
  ].filter((item) => item.error) as { error: string; tab: string }[];

  const submit = handleSubmit(
    (rawData) => {
      const data = rawData as GalleryFormData;
      callback(
        {
          title: data.title,
          code: data.code,
          date: data.date,
          photographer: data.photographer,
          details: data.details,
          studio_id: data.studio?.id ?? null,
          performers: (data.performers ?? []).map((performer) => ({
            performer_id: performer.performerId,
            as: performer.alias || undefined,
          })),
          scene_ids: (data.scenes ?? []).map((scene) => scene.id),
          tag_ids: (data.tags ?? []).map((tag) => tag.id),
          urls: (data.urls ?? []).map((url) => ({
            url: url.url,
            site_id: url.site.id,
          })),
          cover_image_id: data.cover[0]?.id ?? null,
          images: isCreate
            ? (data.images ?? []).map((image) => ({
                index: image.index,
                phash: image.phash,
                tag_ids: (image.tags ?? []).map((tag) => tag.id),
              }))
            : undefined,
          image_tag_updates: isCreate
            ? undefined
            : (data.images ?? []).map((image) => ({
                index: image.index,
                tag_ids: (image.tags ?? []).map((tag) => tag.id),
              })),
        },
        data.note,
      );
    },
    (invalid) => {
      if (invalid.title || invalid.date || invalid.studio)
        setActiveTab("details");
      else if (invalid.urls) setActiveTab("links");
      else if (invalid.cover) setActiveTab("cover");
      else if (invalid.images) setActiveTab("gallery-images");
      else setActiveTab("confirm");
    },
  );

  return (
    <Form className="GalleryForm" onSubmit={submit}>
      <Tabs activeKey={activeTab} onSelect={(key) => key && setActiveTab(key)}>
        <Tab eventKey="details" title="Details" className="col-xl-9">
          <Row>
            <Form.Group className="col-8 mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control {...register("title")} />
              <Form.Text className="text-danger">
                {errors.title?.message}
              </Form.Text>
            </Form.Group>
            <Form.Group className="col-2 mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control placeholder="YYYY-MM-DD" {...register("date")} />
              <Form.Text className="text-danger">
                {errors.date?.message}
              </Form.Text>
            </Form.Group>
            <Form.Group className="col-2 mb-3">
              <Form.Label>Studio Code</Form.Label>
              <Form.Control {...register("code")} />
            </Form.Group>
          </Row>
          <Row>
            <Form.Group className="col-6 mb-3">
              <Form.Label>Studio</Form.Label>
              <Controller
                name="studio"
                control={control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <StudioSelect
                    initialStudio={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    isClearable
                  />
                )}
              />
              <Form.Text className="text-danger">
                {errors.studio && "Studio is required"}
              </Form.Text>
            </Form.Group>
            <Form.Group className="col-6 mb-3">
              <Form.Label>Photographer</Form.Label>
              <Form.Control {...register("photographer")} />
            </Form.Group>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Performers</Form.Label>
            {performers.map((performer, index) => (
              <Row className="mb-2" key={performer.key}>
                <Col xs={7}>
                  <InputGroup>
                    <Button variant="danger" onClick={() => remove(index)}>
                      Remove
                    </Button>
                    <InputGroup.Text className="flex-grow-1">
                      <GenderIcon gender={performer.gender} />
                      <strong>{performer.name}</strong>
                    </InputGroup.Text>
                  </InputGroup>
                </Col>
                <Col xs={5}>
                  <InputGroup>
                    <InputGroup.Text>Gallery Alias</InputGroup.Text>
                    <Form.Control
                      list={`gallery-performer-aliases-${index}`}
                      {...register(`performers.${index}.alias`)}
                    />
                    <datalist id={`gallery-performer-aliases-${index}`}>
                      {(performer.aliases ?? []).map((alias) => (
                        <option key={alias} value={alias} />
                      ))}
                    </datalist>
                  </InputGroup>
                </Col>
              </Row>
            ))}
            <SearchField
              searchType={SearchType.Performer}
              placeholder="Add performer..."
              excludeIDs={performers.map((performer) => performer.performerId)}
              onClickPerformer={(performer) =>
                append({
                  performerId: performer.id,
                  name: performer.name,
                  aliases: performer.aliases,
                  gender: performer.gender,
                  disambiguation: performer.disambiguation,
                  deleted: performer.deleted,
                  alias: "",
                })
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Scenes</Form.Label>
            {scenes.map((scene, index) => (
              <InputGroup className="mb-2" key={scene.key}>
                <Button variant="danger" onClick={() => removeScene(index)}>
                  Remove
                </Button>
                <InputGroup.Text className="flex-grow-1">
                  {scene.title}
                </InputGroup.Text>
              </InputGroup>
            ))}
            <SearchField
              searchType={SearchType.Scene}
              placeholder="Add scene..."
              excludeIDs={scenes.map((scene) => scene.id)}
              onClick={(result) => {
                if (result.__typename === "Scene")
                  appendScene({
                    id: result.id,
                    title: result.title,
                    deleted: result.deleted,
                    release_date: result.release_date,
                  });
              }}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Details</Form.Label>
            <Form.Control
              as="textarea"
              className="description"
              {...register("details")}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Tags</Form.Label>
            <Controller
              name="tags"
              control={control}
              render={({ field: { value, onChange } }) => (
                <TagSelect tags={value} onChange={onChange} />
              )}
            />
          </Form.Group>
          <NavButtons onNext={() => setActiveTab("links")} />
        </Tab>
        <Tab eventKey="links" title="Links" className="col-xl-9">
          <URLInput
            lens={lens.focus("urls").defined()}
            type={ValidSiteTypeEnum.GALLERY}
            errors={errors.urls}
          />
          <NavButtons onNext={() => setActiveTab("cover")} />
        </Tab>
        <Tab eventKey="cover" title="Cover">
          <EditImages
            lens={lens.focus("cover").cast<ImageFragment[]>()}
            maxImages={1}
            file={coverFile}
            setFile={setCoverFile}
            original={gallery?.cover ? [gallery.cover] : undefined}
          />
          <NavButtons
            onNext={() => setActiveTab("gallery-images")}
            disabled={!!coverFile}
          />
        </Tab>
        <Tab eventKey="gallery-images" title="Gallery Images">
          {!isCreate && (
            <p className="text-muted">
              Image indexes and pHashes are immutable. Tags can be changed
              through this edit.
            </p>
          )}
          {images.map((image, index) => (
            <div className="border rounded p-3 mb-3" key={image.key}>
              <Row className="align-items-end">
                <Col xs={2}>
                  <Form.Label>Index</Form.Label>
                  <Form.Control
                    type="number"
                    min={1}
                    disabled={!isCreate}
                    {...register(`images.${index}.index`, {
                      valueAsNumber: true,
                    })}
                  />
                </Col>
                <Col xs={4}>
                  <Form.Label>PHash</Form.Label>
                  <Form.Control
                    disabled={!isCreate}
                    {...register(`images.${index}.phash`)}
                  />
                </Col>
                <Col>
                  <Controller
                    name={`images.${index}.tags`}
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <TagSelect
                        tags={value}
                        onChange={onChange}
                        menuPlacement="top"
                      />
                    )}
                  />
                </Col>
                {isCreate && (
                  <Col xs="auto">
                    <Button variant="danger" onClick={() => removeImage(index)}>
                      Remove
                    </Button>
                  </Col>
                )}
              </Row>
            </div>
          ))}
          {isCreate && (
            <Button
              onClick={() =>
                appendImage({
                  index: images.length + 1,
                  phash: "",
                  tags: [],
                })
              }
            >
              Add Gallery Image
            </Button>
          )}
          <NavButtons onNext={() => setActiveTab("confirm")} />
        </Tab>
        <Tab eventKey="confirm" title="Confirm" className="col-xl-9">
          {!!metadataErrors.length && (
            <Alert variant="danger">
              <h6>
                <Icon icon={faExclamationTriangle} className="me-2" />
                Please correct the form errors before submitting.
              </h6>
              <ul className="mb-0">
                {metadataErrors.map(({ error, tab }) => (
                  <li key={`${tab}-${error}`}>
                    <button
                      type="button"
                      className="btn btn-link p-0"
                      onClick={() => setActiveTab(tab)}
                    >
                      {error}
                    </button>
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          <Row className="my-4">
            <Col md={{ span: 8, offset: 4 }}>
              <EditNote register={register} error={errors.note} />
            </Col>
          </Row>
          <SubmitButtons disabled={saving} />
        </Tab>
      </Tabs>
    </Form>
  );
};

export default GalleryForm;
