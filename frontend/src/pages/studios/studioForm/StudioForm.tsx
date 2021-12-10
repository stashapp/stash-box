import { FC, useMemo, useState } from "react";
import { Row, Col, Form, Tab, Tabs } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";

import { Studio_findStudio as Studio } from "src/graphql/definitions/Studio";
import { StudioEditDetailsInput } from "src/graphql";
import StudioSelect from "src/components/studioSelect";
import EditImages from "src/components/editImages";
import { getUrlByType } from "src/utils";
import { EditNote, NavButtons, SubmitButtons } from "src/components/form";
import { renderStudioDetails } from "src/components/editCard/ModifyEdit";

import { StudioSchema, StudioFormData } from "./schema";
import DiffStudio from "./diff";

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
  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StudioFormData>({
    resolver: yupResolver(StudioSchema),
    defaultValues: {
      name: studio.name,
      images: studio.images,
      studio: studio.parent
        ? {
            id: studio.parent.id,
            name: studio.parent.name,
          }
        : undefined,
    },
  });

  const [file, setFile] = useState<File | undefined>();
  const fieldData = watch();
  const [oldStudioChanges, newStudioChanges] = useMemo(
    () => DiffStudio(StudioSchema.cast(fieldData), studio),
    [fieldData, studio]
  );

  const [activeTab, setActiveTab] = useState("details");

  const onSubmit = (data: StudioFormData) => {
    const callbackData: StudioEditDetailsInput = {
      name: data.name,
      urls: data.url ? [{ url: data.url, type: "HOME" }] : [],
      image_ids: data.images.map((i) => i.id),
      parent_id: data.studio?.id,
    };
    callback(callbackData, data.note);
  };

  return (
    <Form className="StudioForm" onSubmit={handleSubmit(onSubmit)}>
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => key && setActiveTab(key)}
        className="d-flex"
      >
        <Tab eventKey="details" title="Details" className="col-xl-6">
          <Form.Group controlId="name" className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              className={cx({ "is-invalid": errors.name })}
              placeholder="Name"
              defaultValue={studio.name}
              {...register("name")}
            />
            <Form.Control.Feedback type="invalid">
              {errors?.name?.message}
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

          <NavButtons onNext={() => setActiveTab("images")} />
        </Tab>

        <Tab eventKey="images" title="Images" className="col-xl-6">
          <EditImages
            control={control}
            maxImages={1}
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

        <Tab eventKey="confirm" title="Confirm" className="mt-3 col-xl-9">
          {renderStudioDetails(newStudioChanges, oldStudioChanges, true)}
          <Row className="my-4">
            <Col md={{ span: 8, offset: 4 }}>
              <EditNote register={register} error={errors.note} />
            </Col>
          </Row>

          <SubmitButtons disabled={!!file || saving} />
        </Tab>
      </Tabs>
    </Form>
  );
};

export default StudioForm;
