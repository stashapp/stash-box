import { FC, useState, useMemo } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import { Button, Col, Form, InputGroup, Row, Tab, Tabs } from "react-bootstrap";
import { Typeahead, Menu, MenuItem } from "react-bootstrap-typeahead";
import { Link } from "react-router-dom";
import {
  faExclamationTriangle,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";

import { formatDuration, parseDuration, performerHref } from "src/utils";
import {
  ValidSiteTypeEnum,
  SceneEditDetailsInput,
  GenderEnum,
  FingerprintAlgorithm,
  SceneFragment as Scene,
} from "src/graphql";

import { renderSceneDetails } from "src/components/editCard/ModifyEdit";
import { GenderIcon, Icon } from "src/components/fragments";
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
import { InitialScene } from "./types";
import ExistingSceneAlert from "./ExistingSceneAlert";
import FingerprintInput from "src/components/fingerprintInput";

const CLASS_NAME = "SceneForm";
const CLASS_NAME_PERFORMER_CHANGE = `${CLASS_NAME}-performer-change`;

interface SceneProps {
  scene?: Scene | null;
  initial?: InitialScene;
  callback: (updateData: SceneEditDetailsInput, editNote: string) => void;
  saving: boolean;
  isCreate?: boolean;
  draftFingerprints?: {
    hash: string;
    algorithm: FingerprintAlgorithm;
    duration: number;
  }[];
}

const SceneForm: FC<SceneProps> = ({
  scene,
  initial,
  callback,
  saving,
  isCreate = false,
  draftFingerprints,
}) => {
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
      date: initial?.date ?? scene?.release_date ?? undefined,
      duration: formatDuration(initial?.duration ?? scene?.duration),
      director: initial?.director ?? scene?.director,
      code: initial?.code ?? scene?.code,
      urls: initial?.urls ?? scene?.urls ?? [],
      images: initial?.images ?? scene?.images ?? [],
      studio: initial?.studio ?? scene?.studio ?? undefined,
      tags: initial?.tags ?? scene?.tags ?? [],
      performers: (initial?.performers ?? scene?.performers ?? []).map((p) => ({
        performerId: p.performer.id,
        name: p.performer.name,
        alias: p.as ?? "",
        aliases: p.performer.aliases,
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

  const fieldData = watch();
  const [oldSceneChanges, newSceneChanges] = useMemo(
    () =>
      DiffScene(
        SceneSchema.cast(fieldData, {
          assert: "ignore-optionality",
        }) as SceneFormData,
        scene
      ),
    [fieldData, scene]
  );

  const [isChanging, setChange] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState("details");
  const [file, setFile] = useState<File | undefined>();

  const onSubmit = (data: SceneFormData) => {
    const sceneData: SceneEditDetailsInput = {
      title: data.title,
      date: data.date,
      duration: parseDuration(data.duration),
      director: data.director,
      code: data.code,
      details: data.details,
      studio_id: data.studio?.id,
      performers: (data.performers ?? []).map((performance) => ({
        performer_id: performance.performerId,
        as: performance.alias,
      })),
      image_ids: data.images.map((i) => i.id),
      tag_ids: data.tags?.map((t) => t.id),
      urls: data.urls?.map((u) => ({
        url: u.url,
        site_id: u.site.id,
      })),
      fingerprints: data.fingerprints?.map((f) => ({
        algorithm: f.algorithm as FingerprintAlgorithm,
        hash: f.hash,
        duration: f.duration,
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
      aliases: result.aliases,
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
      aliases: result.aliases,
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
              <>
                <InputGroup.Text className="flex-grow-1 text-start text-truncate">
                  <GenderIcon gender={p.gender as GenderEnum} />
                  <span
                    className={cx("performer-name text-truncate", {
                      "text-decoration-line-through": p.deleted,
                    })}
                  >
                    <b>{p.name}</b>
                    {p.disambiguation && (
                      <small className="ms-1">({p.disambiguation})</small>
                    )}
                  </span>
                </InputGroup.Text>
                <Button
                  variant="primary"
                  href={performerHref({ id: p.performerId })}
                  target="_blank"
                >
                  <Icon icon={faExternalLinkAlt} />
                </Button>
              </>
            )}
          </>
        </InputGroup>
      </Col>

      <Col xs={{ span: 5, offset: 1 }}>
        <InputGroup>
          <InputGroup.Text>Scene Alias</InputGroup.Text>

          <Controller
            name={`performers.${index}.alias`}
            control={control}
            render={({ field: { onChange } }) => (
              <Typeahead
                id={`performers.${index}.alias`}
                onInputChange={onChange}
                onChange={(selected) =>
                  selected.length && onChange(selected[0])
                }
                options={p.aliases ?? []}
                defaultInputValue={p.alias ?? ""}
                emptyLabel={""}
                renderMenu={(results, { id }) => {
                  if (!results.length) {
                    return <></>;
                  }
                  return (
                    <Menu id={id}>
                      <MenuItem
                        option="aliases"
                        position={0}
                        key={"header"}
                        disabled
                      >
                        <b className="text-dark">{`${p.name}'s Aliases`}</b>
                      </MenuItem>
                      {results.map((result, idx) => (
                        <MenuItem
                          option={result}
                          position={idx + 1}
                          key={`${result}-idx`}
                        >
                          {result as string}
                        </MenuItem>
                      ))}
                    </Menu>
                  );
                }}
                placeholder={p.name}
              />
            )}
          />
        </InputGroup>
      </Col>
    </Row>
  ));

  const metadataErrors = [
    { error: errors.title?.message, tab: "details" },
    { error: errors.date?.message, tab: "details" },
    { error: errors.duration?.message, tab: "details" },
    {
      error: errors.studio !== undefined ? "Studio is required" : undefined,
      tab: "details",
    },
    {
      error: errors.urls?.find?.((u) => u?.url?.message)?.url?.message,
      tab: "links",
    },
  ].filter((e) => e.error) as { error: string; tab: string }[];

  return (
    <Form className={CLASS_NAME} onSubmit={handleSubmit(onSubmit)}>
      {isCreate && (
        <Row>
          <Col xs={9}>
            <ExistingSceneAlert
              title={fieldData.title}
              studio_id={fieldData.studio?.id}
              fingerprints={draftFingerprints}
            />
          </Col>
        </Row>
      )}
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
                {...register("date")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.date?.message}
              </Form.Control.Feedback>
              {/* <Form.Text>
                If the precise date is unknown the day and/or month can be
                omitted.
              </Form.Text> */}
            </Form.Group>

            <Form.Group controlId="duration" className="col-2 mb-3">
              <Form.Label>Duration</Form.Label>
              <Form.Control
                as="input"
                className={cx({ "is-invalid": errors.duration })}
                placeholder="Duration"
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
              <Controller
                name="studio"
                control={control}
                render={({ field: { onChange, onBlur, value } }) => (
                  <StudioSelect
                    initialStudio={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    isClearable
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors.studio !== undefined ? "Studio is required" : null}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="code" className="col-6 mb-3">
              <Form.Label>Studio Code</Form.Label>
              <Form.Control
                as="input"
                type="text"
                placeholder="Unique code used by studio to identify scene"
                {...register("code")}
              />
            </Form.Group>
          </Row>

          <Row>
            <Form.Group controlId="details" className="col mb-3">
              <Form.Label>Details</Form.Label>
              <Form.Control
                as="textarea"
                className="description"
                placeholder="Details"
                {...register("details")}
              />
            </Form.Group>
          </Row>

          <Row>
            <Form.Group controlId="director" className="col-4 mb-3">
              <Form.Label>Director</Form.Label>
              <Form.Control
                as="input"
                type="text"
                placeholder="Director"
                {...register("director")}
              />
            </Form.Group>

            <Form.Group className="col-8 mb-3" />
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Tags</Form.Label>
            <Controller
              name="tags"
              control={control}
              render={({ field: { onChange, value } }) => (
                <TagSelect
                  tags={value}
                  onChange={onChange}
                  menuPlacement="top"
                />
              )}
            />
          </Form.Group>

          <NavButtons onNext={() => setActiveTab("links")} />
        </Tab>

        <Tab eventKey="links" title="Links" className="col-xl-9">
          <URLInput
            control={control}
            type={ValidSiteTypeEnum.SCENE}
            errors={errors.urls}
          />

          <NavButtons onNext={() => setActiveTab("hashes")} />
        </Tab>

        <Tab eventKey="hashes" title="Hashes" className="col-xl-9">
          <FingerprintInput control={control} errors={errors.urls} />
          <NavButtons onNext={() => setActiveTab("images")} />
        </Tab>

        <Tab eventKey="images" title="Images">
          <EditImages
            control={control}
            maxImages={1}
            file={file}
            setFile={(f) => setFile(f)}
            original={scene?.images}
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
          {renderSceneDetails(newSceneChanges, oldSceneChanges, !!scene)}
          <Row className="my-4">
            <Col md={{ span: 8, offset: 4 }}>
              <EditNote register={register} error={errors.note} />
            </Col>
          </Row>

          {metadataErrors.length > 0 && (
            <div className="text-end my-4">
              <h6>
                <Icon icon={faExclamationTriangle} color="red" />
                <span className="ms-1">Errors</span>
              </h6>
              <div className="d-flex flex-column text-danger">
                {metadataErrors.map(({ error, tab }) => (
                  <Link to="#" key={error} onClick={() => setActiveTab(tab)}>
                    {error}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <SubmitButtons disabled={saving} />
        </Tab>
      </Tabs>
    </Form>
  );
};

export default SceneForm;
