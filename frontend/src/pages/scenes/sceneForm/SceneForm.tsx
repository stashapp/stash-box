import { FC, useState, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import { Button, Col, Form, InputGroup, Row, Tab, Tabs } from "react-bootstrap";

import { Scene_findScene as Scene } from "src/graphql/definitions/Scene";
import { Tags_queryTags_tags as Tag } from "src/graphql/definitions/Tags";
import { formatDuration, parseDuration } from "src/utils";
import { ValidSiteTypeEnum, SceneEditDetailsInput } from "src/graphql";

import { renderSceneDetails } from "src/components/editCard/ModifyEdit";
import { GenderIcon } from "src/components/fragments";
import SearchField, {
  SearchType,
  PerformerResult,
} from "src/components/searchField";
import TagSelect from "src/components/tagSelect";
import StudioSelect from "src/components/studioSelect";
import EditImages from "src/components/editImages";
import { EditNote, NavButtons, SubmitButtons } from "src/components/form";
import URLInput from "src/components/urlInput";
import DiffScene from "./diff";
import { SceneSchema, SceneFormData } from "./schema";

const CLASS_NAME = "SceneForm";
const CLASS_NAME_PERFORMER_CHANGE = `${CLASS_NAME}-performer-change`;

interface SceneProps {
  scene: Scene;
  initial?: Scene;
  callback: (updateData: SceneEditDetailsInput, editNote: string) => void;
  saving: boolean;
}

const SceneForm: FC<SceneProps> = ({ scene, initial, callback, saving }) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SceneFormData>({
    resolver: yupResolver(SceneSchema),
    mode: "onBlur",
    defaultValues: {
      title: initial?.title ?? scene?.title ?? undefined,
      details: initial?.details ?? scene?.details ?? undefined,
      date: initial?.date ?? scene?.date,
      duration: formatDuration(initial?.duration ?? scene?.duration),
      director: initial?.director ?? scene?.director,
      urls: initial?.urls ?? scene.urls ?? [],
      images: initial?.images ?? scene.images,
      studio: initial?.studio ?? scene.studio ?? undefined,
      tags: initial?.tags ?? scene.tags,
      performers: (initial?.performers ?? scene.performers).map((p) => ({
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
    () => DiffScene(SceneSchema.cast(fieldData), scene),
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
      urls: data.urls.map((u) => ({
        url: u.url,
        site_id: u.site.id,
      })),
    };

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

  const handleRemove = (index: number) => {
    if (isChanging && isChanging > index) setChange(isChanging - 1);
    else if (isChanging === index) setChange(undefined);
    removePerformer(index);
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

  const currentPerformerIds = performerFields.map((p) => p.performerId);

  const performerList = performerFields.map((p, index) => (
    <Row className="performer-item d-flex g-0" key={p.performerId}>
      <Form.Control
        type="hidden"
        defaultValue={p.performerId}
        {...register(`performers.${index}.performerId`)}
      />

      <Col xs={6}>
        <InputGroup className="flex-nowrap">
          <Button variant="danger" onClick={() => handleRemove(index)}>
            Remove
          </Button>
          <>
            {isChanging === index ? (
              <Button
                className={CLASS_NAME_PERFORMER_CHANGE}
                variant="primary"
                onClick={() => setChange(undefined)}
              >
                Cancel
              </Button>
            ) : (
              <Button
                className={CLASS_NAME_PERFORMER_CHANGE}
                variant="primary"
                onClick={() => setChange(index)}
              >
                Change
              </Button>
            )}
          </>
          <>
            {isChanging === index ? (
              <SearchField
                autoFocus
                onClick={(res) =>
                  res.__typename === "Performer" && handleChange(res, index)
                }
                excludeIDs={currentPerformerIds.filter(
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
          </>
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
    <Form className={CLASS_NAME} onSubmit={handleSubmit(onSubmit)}>
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
                  excludeIDs={currentPerformerIds}
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
                className={cx({ "is-invalid": errors.studio?.id })}
              />
              <Form.Control.Feedback type="invalid">
                {errors.studio?.id?.message}
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

          <NavButtons onNext={() => setActiveTab("links")} />
        </Tab>

        <Tab eventKey="links" title="Links" className="col-xl-9">
          <URLInput control={control} type={ValidSiteTypeEnum.SCENE} />

          <NavButtons onNext={() => setActiveTab("images")} />
        </Tab>

        <Tab eventKey="images" title="Images">
          <EditImages
            control={control}
            file={file}
            setFile={(f) => setFile(f)}
          />

          <NavButtons
            onNext={() => setActiveTab("confirm")}
            disabled={!!file}
          />

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

          <SubmitButtons disabled={saving} />
        </Tab>
      </Tabs>
    </Form>
  );
};

export default SceneForm;
