/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@apollo/client";
import { useHistory, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers";
import Select, { ValueType, OptionTypeBase } from "react-select";
import * as yup from "yup";
import cx from "classnames";
import { Button, Form, Table } from "react-bootstrap";
import { loader } from "graphql.macro";

import { Studios, StudiosVariables } from "src/definitions/Studios";
import { Scene_findScene as Scene } from "src/definitions/Scene";
import { Tags_queryTags_tags as Tag } from "src/definitions/Tags";
import {
  SceneUpdateInput,
  FingerprintInput,
  FingerprintAlgorithm,
} from "src/definitions/globalTypes";
import { getUrlByType } from "src/utils/transforms";

import {
  GenderIcon,
  LoadingIndicator,
  CloseButton,
  Icon,
} from "src/components/fragments";
import SearchField, { SearchType } from "src/components/searchField";
import TagSelect from "src/components/tagSelect";

const StudioQuery = loader("src/queries/Studios.gql");

interface IOptionType extends OptionTypeBase {
  value: string;
  label: string;
}

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;

const schema = yup.object().shape({
  id: yup.string(),
  title: yup.string().required("Title is required"),
  details: yup.string().trim(),
  date: yup
    .string()
    .transform(nullCheck)
    .matches(/^\d{4}$|^\d{4}-\d{2}$|^\d{4}-\d{2}-\d{2}$/, {
      excludeEmptyString: true,
      message: "Invalid date",
    })
    .nullable(),
  studioId: yup
    .string()
    .typeError("Studio is required")
    .transform(nullCheck)
    .required("Studio is required"),
  studioURL: yup.string().url("Invalid URL").transform(nullCheck).nullable(),
  performers: yup
    .array()
    .of(
      yup.object().shape({
        performerId: yup.string().required(),
        alias: yup.string().transform(nullCheck).nullable(),
      })
    )
    .nullable(),
  fingerprints: yup
    .array()
    .of(
      yup.object().shape({
        algorithm: yup
          .string()
          .oneOf(Object.keys(FingerprintAlgorithm))
          .required(),
        hash: yup.string().required(),
      })
    )
    .nullable(),
  tags: yup.array().of(yup.string()).nullable(),
});

type SceneFormData = yup.InferType<typeof schema>;

interface SceneProps {
  scene: Scene;
  callback: (updateData: SceneUpdateInput) => void;
}

interface PerformerInfo {
  alias: string[];
  name: string;
  id: string;
  gender: string | null;
}

const SceneForm: React.FC<SceneProps> = ({ scene, callback }) => {
  const history = useHistory();
  const fingerprintHash = useRef<HTMLInputElement>(null);
  const fingerprintDuration = useRef<HTMLInputElement>(null);
  const fingerprintAlgorithm = useRef<HTMLSelectElement>(null);
  const { register, handleSubmit, setValue, errors } = useForm<SceneFormData>({
    resolver: yupResolver(schema),
  });
  const [performers, setPerformers] = useState<PerformerInfo[]>(
    scene.performers.map((p) => ({
      id: p.performer.id,
      name: p.performer.name,
      alias: p.as ? [p.as] : [],
      gender: p.performer.gender,
    }))
  );
  const [fingerprints, setFingerprints] = useState<FingerprintInput[]>(
    scene.fingerprints.map((f) => ({
      hash: f.hash,
      algorithm: f.algorithm,
      duration: f.duration,
    }))
  );
  const { loading: loadingStudios, data: studios } = useQuery<
    Studios,
    StudiosVariables
  >(StudioQuery, {
    variables: { filter: { page: 0, per_page: 1000 } },
  });
  useEffect(() => {
    register({ name: "studioId" });
    register({ name: "tags" });
    register({ name: "fingerprints" });
    setValue("fingerprints", fingerprints);
    setValue("tags", scene.tags ? scene.tags.map((tag) => tag.id) : []);
    if (scene?.studio?.id) setValue("studioId", scene.studio.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, setValue]);

  if (loadingStudios) return <LoadingIndicator message="Loading scene..." />;

  const onStudioChange = (selectedOption: ValueType<IOptionType>) =>
    setValue("studioId", (selectedOption as IOptionType).value);
  const onTagChange = (selectedTags: Tag[]) =>
    setValue(
      "tags",
      selectedTags.map((t) => t.id)
    );

  const onSubmit = (data: SceneFormData) => {
    const sceneData: SceneUpdateInput = {
      id: data.id,
      title: data.title,
      date: data.date,
      details: data.details,
      studio_id: data.studioId,
      performers: (data.performers ?? []).map((performance) => ({
        performer_id: performance.performerId,
        as: performance.alias,
      })),
      fingerprints: data.fingerprints as FingerprintInput[],
      tag_ids: data.tags,
    };
    const urls = [];
    if (data.studioURL) urls.push({ url: data.studioURL, type: "STUDIO" });
    sceneData.urls = urls;

    callback(sceneData);
  };

  const studioObj = (studios?.queryStudios?.studios ?? []).map((studio) => ({
    value: studio.id,
    label: studio.name,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addPerformer = (result: any) =>
    setPerformers([
      ...performers,
      {
        name: result.name,
        id: result.id,
        gender: result.gender,
        alias: [],
      },
    ]);
  const removePerformer = (id: string) =>
    setPerformers(performers.filter((p) => p.id !== id));
  const performerList = performers.map((p, index) => (
    <div className="performer-item" key={p.id}>
      <CloseButton
        className="remove-item"
        handler={() => removePerformer(p.id)}
      />
      <GenderIcon gender={p.gender} />
      <input
        type="hidden"
        value={p.id}
        name={`performers[${index}].performerId`}
        ref={register}
      />
      <span className="performer-name">{p.name}</span>
      <label htmlFor={`performers[${index}].alias`}>
        <span>Alias used: </span>
        <input
          className="performer-alias"
          type="text"
          name={`performers[${index}].alias`}
          defaultValue={p.alias?.[0] !== p.name ? p.alias[0] : ""}
          placeholder={p.name}
          ref={register}
        />
      </label>
    </div>
  ));

  const addFingerprint = () => {
    if (
      !fingerprintHash.current ||
      !fingerprintAlgorithm.current ||
      !fingerprintDuration.current
    )
      return;
    const hash = fingerprintHash.current.value?.trim();
    const algorithm = fingerprintAlgorithm.current
      .value as FingerprintAlgorithm;
    const duration =
      Number.parseInt(fingerprintDuration.current.value?.trim(), 10) ?? 0;
    if (
      !algorithm ||
      !hash ||
      !duration ||
      fingerprints.some((f) => f.hash === hash) ||
      hash === ""
    )
      return;
    const newFingerprints = [...fingerprints, { hash, algorithm, duration }];
    setFingerprints(newFingerprints);
    setValue("fingerprints", newFingerprints);
    fingerprintHash.current.value = "";
    fingerprintDuration.current.value = "";
  };
  const removeFingerprint = (hash: string) => {
    const newFingerprints = fingerprints.filter((f) => f.hash !== hash);
    setFingerprints(newFingerprints);
    setValue("fingerprints", newFingerprints);
  };

  const renderFingerprints = () => {
    const fingerprintList = fingerprints.map((f) => (
      <tr key={f.hash}>
        <td>
          <button
            className="remove-item"
            type="button"
            onClick={() => removeFingerprint(f.hash)}
          >
            <Icon icon="times-circle" />
          </button>
        </td>
        <td>{f.algorithm}</td>
        <td>{f.hash}</td>
        <td>{f.duration}</td>
      </tr>
    ));

    return fingerprints.length > 0 ? (
      <Table size="sm">
        <thead>
          <tr>
            <th />
            <th>Algorithm</th>
            <th>Hash</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>{fingerprintList}</tbody>
      </Table>
    ) : (
      <div>No fingerprints found for this scene.</div>
    );
  };

  return (
    <Form className="SceneForm" onSubmit={handleSubmit(onSubmit)}>
      <input
        type="hidden"
        name="id"
        value={scene.id}
        ref={register({ required: true })}
      />
      <div className="row">
        <div className="col-8">
          <div className="form-group row">
            <label htmlFor="title" className="col-8">
              <div>Title</div>
              <input
                className={cx("form-control", { "is-invalid": errors.title })}
                type="text"
                placeholder="Title"
                name="title"
                defaultValue={scene?.title ?? ""}
                ref={register({ required: true })}
              />
              <div className="invalid-feedback">{errors?.title?.message}</div>
            </label>
            <label htmlFor="date" className="col-4">
              <div>Date</div>
              <input
                className={cx("form-control", { "is-invalid": errors.date })}
                type="text"
                placeholder="YYYY-MM-DD"
                name="date"
                defaultValue={scene.date}
                ref={register}
              />
              <div className="invalid-feedback">{errors?.date?.message}</div>
            </label>
          </div>

          <div className="form-group row">
            <div className="col">
              <div className="label">Performers</div>
              {performerList}
              <div className="add-performer">
                <span>Add performer:</span>
                <SearchField
                  onClick={addPerformer}
                  searchType={SearchType.Performer}
                />
              </div>
            </div>
          </div>

          <div className="form-group row">
            <label htmlFor="studioId" className="studio-select col-6">
              <div>Studio</div>
              <Select
                classNamePrefix="react-select"
                className={cx({ "is-invalid": errors.studioId })}
                name="studioId"
                onChange={onStudioChange}
                options={studioObj}
                defaultValue={
                  scene?.studio?.id
                    ? studioObj.find((s) => s.value === scene.studio?.id)
                    : { label: "", value: "" }
                }
              />
              <div className="invalid-feedback">
                {errors?.studioId?.message}
              </div>
            </label>
            <label htmlFor="studioURL" className="col-6">
              <div>Studio URL</div>
              <input
                type="url"
                className={cx("form-control", {
                  "is-invalid": errors.studioURL,
                })}
                name="studioURL"
                defaultValue={getUrlByType(scene.urls, "STUDIO")}
                ref={register}
              />
              <div className="invalid-feedback">
                {errors?.studioURL?.message}
              </div>
            </label>
          </div>

          <div className="form-group row">
            <label htmlFor="details" className="col">
              <div>Details</div>
              <textarea
                className="form-control description"
                placeholder="Details"
                name="details"
                defaultValue={scene?.details ?? ""}
                ref={register}
              />
            </label>
          </div>

          <Form.Group>
            <Form.Label>Tags</Form.Label>
            <TagSelect tags={scene.tags} onChange={onTagChange} />
          </Form.Group>

          <Form.Group>
            <Form.Label>Fingerprints</Form.Label>
            {renderFingerprints()}
          </Form.Group>

          <Form.Group className="add-fingerprint row">
            <Form.Label htmlFor="hash" column>
              Add fingerprint:
            </Form.Label>
            <Form.Control
              id="algorithm"
              as="select"
              className="col-2 mr-1"
              ref={fingerprintAlgorithm}
            >
              <option value="OSO">OSO</option>
              <option value="MD5">MD5</option>
            </Form.Control>
            <Form.Control
              id="hash"
              placeholder="Hash"
              className="col-3 mr-2"
              ref={fingerprintHash}
            />
            <Form.Control
              id="duration"
              placeholder="Duration"
              type="number"
              className="col-2 mr-2"
              ref={fingerprintDuration}
            />
            <Button
              className="col-2 add-performer-button"
              onClick={addFingerprint}
            >
              Add
            </Button>
          </Form.Group>

          <Form.Group className="d-flex">
            <Button className="col-2" type="submit">
              Save
            </Button>
            <Button type="reset" variant="secondary" className="ml-auto mr-2">
              Reset
            </Button>
            <Link to={scene.id ? `/scenes/${scene.id}` : "/scenes"}>
              <Button variant="danger" onClick={() => history.goBack()}>
                Cancel
              </Button>
            </Link>
          </Form.Group>
        </div>
      </div>
    </Form>
  );
};

export default SceneForm;
