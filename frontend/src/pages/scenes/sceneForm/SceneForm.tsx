import { FC, useState, useMemo } from "react";
import { useHistory } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import cx from "classnames";
import { Button, Col, Form, InputGroup, Row, Tab, Tabs } from "react-bootstrap";

import { Scene_findScene as Scene } from "src/graphql/definitions/Scene";
import { Tags_queryTags_tags as Tag } from "src/graphql/definitions/Tags";
import { GenderEnum, SceneEditDetailsInput } from "src/graphql";
import { getUrlByType, formatDuration, parseDuration } from "src/utils";

import { renderSceneDetails } from "src/components/editCard/ModifyEdit";
import { GenderIcon } from "src/components/fragments";
import SearchField, {
  SearchType,
  PerformerResult,
} from "src/components/searchField";
import TagSelect from "src/components/tagSelect";
import StudioSelect from "src/components/studioSelect";
import EditImages from "src/components/editImages";
import { EditNote } from "src/components/form";
import DiffScene from "./diff";

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;

const schema = yup.object({
  title: yup.string().required("Title is required"),
  details: yup.string().trim(),
  date: yup
    .string()
    .transform(nullCheck)
    .matches(/^\d{4}-\d{2}-\d{2}$/, {
      excludeEmptyString: true,
      message: "Invalid date",
    })
    .nullable()
    .required("Release date is required"),
  duration: yup
    .string()
    .matches(/^((\d+:)?([0-5]?\d):)?([0-5]?\d)$/, {
      excludeEmptyString: true,
      message: "Invalid duration, format should be HH:MM:SS",
    })
    .nullable(),
  director: yup.string().trim().transform(nullCheck).nullable(),
  studio: yup
    .object({
      id: yup.string().required("asdasd"),
      name: yup.string().required(),
    })
    .nullable()
    .required("Studio is required"),
  studioURL: yup.string().url("Invalid URL").transform(nullCheck).nullable(),
  performers: yup
    .array()
    .of(
      yup
        .object({
          performerId: yup.string().required(),
          name: yup.string().required(),
          disambiguation: yup.string().nullable(),
          alias: yup.string().trim().transform(nullCheck).nullable(),
          gender: yup.string().oneOf(Object.keys(GenderEnum)).nullable(),
          deleted: yup.bool().required(),
        })
        .required()
    )
    .ensure(),
  tags: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        name: yup.string().required(),
      })
    )
    .ensure(),
  images: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        url: yup.string().required(),
      })
    )
    .required(),
  note: yup.string().required("Edit note is required"),
});

type SceneFormData = yup.Asserts<typeof schema>;
export type CastedSceneFormData = yup.TypeOf<typeof schema>;

interface SceneProps {
  scene: Scene;
  callback: (updateData: SceneEditDetailsInput, editNote: string) => void;
  saving: boolean;
}

const SceneForm: FC<SceneProps> = ({ scene, callback, saving }) => {
  const history = useHistory();
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SceneFormData>({
    resolver: yupResolver(schema),
    mode: "onBlur",
    defaultValues: {
      title: scene?.title ?? undefined,
      details: scene?.details ?? undefined,
      date: scene?.date,
      duration: formatDuration(scene?.duration),
      director: scene?.director,
      studioURL: getUrlByType(scene.urls, "STUDIO"),
      images: scene.images,
      studio: scene.studio ?? undefined,
      tags: scene.tags,
      performers: scene.performers.map((p) => ({
        performerId: p.performer.id,
        name: p.performer.name,
        alias: p.as ?? "",
        gender: p.performer.gender,
        disambiguation: p.performer.disambiguation,
        deleted: p.performer.deleted,
      })),
    },
  });
  const {
    fields: performerFields,
    append: appendPerformer,
    remove: removePerformer,
    update: updatePerformer,
  } = useFieldArray({
    control,
    name: "performers",
    keyName: "key",
  });
  const { replace: replaceTags } = useFieldArray({
    control,
    name: "tags",
    keyName: "key",
  });

  const fieldData = watch();
  const [oldSceneChanges, newSceneChanges] = useMemo(
    () => DiffScene(schema.cast(fieldData), scene),
    [fieldData, scene]
  );

  const [isChanging, setChange] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState("details");
  const [file, setFile] = useState<File | undefined>();

  const onTagChange = (selectedTags: Tag[]) =>
    replaceTags(selectedTags.map((t) => ({ id: t.id, name: t.name })));

  const onSubmit = (data: SceneFormData) => {
    const sceneData: SceneEditDetailsInput = {
      title: data.title,
      date: data.date,
      duration: parseDuration(data.duration),
      director: data.director,
      details: data.details,
      studio_id: data.studio?.id,
      performers: (data.performers ?? []).map((performance) => ({
        performer_id: performance.performerId,
        as: performance.alias,
      })),
      image_ids: data.images.map((i) => i.id),
      tag_ids: data.tags.map((t) => t.id),
    };
    const urls = [];
    if (data.studioURL) urls.push({ url: data.studioURL, type: "STUDIO" });
    sceneData.urls = urls;

    callback(sceneData, data.note);
  };

  const addPerformer = (result: PerformerResult) => {
    appendPerformer({
      name: result.name,
      performerId: result.id,
      gender: result.gender,
      alias: "",
      disambiguation: result.disambiguation ?? undefined,
      deleted: result.deleted,
    });
  };

  const handleChange = (result: PerformerResult, index: number) => {
    setChange(undefined);
    const alias = performerFields[index].alias || performerFields[index].name;
    updatePerformer(index, {
      name: result.name,
      performerId: result.id,
      gender: result.gender,
      alias: alias === result.name ? "" : alias,
      disambiguation: result.disambiguation ?? undefined,
      deleted: result.deleted,
    });
  };

  const currentPerformerIds = () => performerFields.map((p) => p.performerId);

  const performerList = performerFields.map((p, index) => (
    <Row className="performer-item d-flex g-0" key={p.performerId}>
      <Form.Control
        type="hidden"
        defaultValue={p.performerId}
        {...register(`performers.${index}.performerId`)}
      />

      <Col xs={6}>
        <InputGroup className="flex-nowrap">
          <Button variant="danger" onClick={() => removePerformer(index)}>
            Remove
          </Button>
          <>
            {isChanging === index ? (
              <Button variant="primary" onClick={() => setChange(undefined)}>
                Cancel
              </Button>
            ) : (
              <Button variant="primary" onClick={() => setChange(index)}>
                Change
              </Button>
            )}
          </>
          <span className="flex-grow-1">
            {isChanging === index ? (
              <SearchField
                onClick={(res) =>
                  res.__typename === "Performer" && handleChange(res, index)
                }
                excludeIDs={currentPerformerIds().filter(
                  (id) => id !== p.performerId
                )}
                searchType={SearchType.Performer}
              />
            ) : (
              <InputGroup.Text className="flex-grow-1 text-start text-truncate">
                <GenderIcon gender={p.gender} />
                <span className="performer-name text-truncate">
                  <b>{p.name}</b>
                  {p.disambiguation && (
                    <small className="ms-1">({p.disambiguation})</small>
                  )}
                </span>
              </InputGroup.Text>
            )}
          </span>
        </InputGroup>
      </Col>

      <Col xs={{ span: 5, offset: 1 }}>
        <InputGroup>
          <InputGroup.Text>Scene Alias</InputGroup.Text>
          <Form.Control
            className="performer-alias"
            defaultValue={p.alias ?? ""}
            placeholder={p.name}
            {...register(`performers.${index}.alias`)}
          />
        </InputGroup>
      </Col>
    </Row>
  ));

  return (
    <Form className="SceneForm" onSubmit={handleSubmit(onSubmit)}>
      <Tabs activeKey={activeTab} onSelect={(key) => key && setActiveTab(key)}>
        <Tab eventKey="details" title="Details" className="col-xl-9">
          <Row>
            <Form.Group controlId="title" className="col-8 mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                as="input"
                className={cx({ "is-invalid": errors.title })}
                type="text"
                placeholder="Title"
                defaultValue={scene?.title ?? ""}
                {...register("title", { required: true })}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.title?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="date" className="col-2 mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control
                as="input"
                className={cx({ "is-invalid": errors.date })}
                type="text"
                placeholder="YYYY-MM-DD"
                defaultValue={scene.date}
                {...register("date")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.date?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="duration" className="col-2 mb-3">
              <Form.Label>Duration</Form.Label>
              <Form.Control
                as="input"
                className={cx({ "is-invalid": errors.duration })}
                placeholder="Duration"
                defaultValue={scene?.duration ?? ""}
                {...register("duration")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.duration?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group className="col mb-3">
              <Form.Label>Performers</Form.Label>
              {performerList}
              <div className="add-performer">
                <span>Add performer:</span>
                <SearchField
                  onClick={(res) =>
                    res.__typename === "Performer" && addPerformer(res)
                  }
                  excludeIDs={currentPerformerIds()}
                  searchType={SearchType.Performer}
                />
              </div>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group
              controlId="studioId"
              className="studio-select col-6 mb-3"
            >
              <Form.Label>Studio</Form.Label>
              <StudioSelect
                initialStudio={scene.studio}
                control={control}
                isClearable
              />
              <Form.Control.Feedback type="invalid">
                {/* Workaround for typing error in react-hook-form */}
                {(errors.studio as { message: string })?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="studioURL" className="col-6 mb-3">
              <Form.Label>Studio URL</Form.Label>
              <Form.Control
                as="input"
                className={cx({ "is-invalid": errors.studioURL })}
                type="url"
                defaultValue={getUrlByType(scene.urls, "STUDIO")}
                {...register("studioURL")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.studioURL?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group controlId="details" className="col mb-3">
              <Form.Label>Details</Form.Label>
              <Form.Control
                as="textarea"
                className="description"
                placeholder="Details"
                defaultValue={scene?.details ?? ""}
                {...register("details")}
              />
            </Form.Group>
          </Row>

          <Row>
            <Form.Group controlId="director" className="col-4 mb-3">
              <Form.Label>Director</Form.Label>
              <Form.Control
                as="input"
                className={cx({ "is-invalid": errors.director })}
                type="text"
                placeholder="Director"
                defaultValue={scene?.director ?? ""}
                {...register("director")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.director?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="col-8 mb-3" />
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Tags</Form.Label>
            <TagSelect tags={scene.tags} onChange={onTagChange} />
          </Form.Group>

          <div className="d-flex mt-1">
            <Button
              variant="danger"
              className="ms-auto me-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button className="me-1" onClick={() => setActiveTab("images")}>
              Next
            </Button>
          </div>
        </Tab>
        <Tab eventKey="images" title="Images">
          <EditImages
            control={control}
            file={file}
            setFile={(f) => setFile(f)}
          />

          <div className="d-flex mt-1">
            <Button
              variant="danger"
              className="ms-auto me-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button
              className="me-1"
              disabled={!!file}
              onClick={() => setActiveTab("confirm")}
            >
              Next
            </Button>
          </div>
          <div className="d-flex">
            {/* dummy element for feedback */}
            <div className="ms-auto">
              <span className={file ? "is-invalid" : ""} />
              <Form.Control.Feedback type="invalid">
                Upload or remove image to continue.
              </Form.Control.Feedback>
            </div>
          </div>
        </Tab>
        <Tab eventKey="confirm" title="Confirm" className="mt-2 col-xl-9">
          {renderSceneDetails(newSceneChanges, oldSceneChanges, true)}
          <Row className="my-4">
            <Col md={{ span: 8, offset: 4 }}>
              <EditNote register={register} error={errors.note} />
            </Col>
          </Row>
          <div className="d-flex mt-2">
            <Button
              variant="danger"
              className="ms-auto me-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled
              className="d-none"
              aria-hidden="true"
            />
            <Button type="submit" disabled={saving}>
              Submit Edit
            </Button>
          </div>
        </Tab>
      </Tabs>
    </Form>
  );
};

export default SceneForm;
