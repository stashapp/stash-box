import { FC, useMemo, useState } from "react";
import { Row, Col, Form, Tab, Tabs } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import cx from "classnames";
import { Link } from "react-router-dom";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

import {
  StudioEditDetailsInput,
  ValidSiteTypeEnum,
  StudioFragment as Studio,
} from "src/graphql";
import { Icon } from "src/components/fragments";
import StudioSelect from "src/components/studioSelect";
import EditImages from "src/components/editImages";
import { EditNote, NavButtons, SubmitButtons } from "src/components/form";
import URLInput from "src/components/urlInput";
import { renderStudioDetails } from "src/components/editCard/ModifyEdit";

import { StudioSchema, StudioFormData } from "./schema";
import { InitialStudio } from "./types";
import DiffStudio from "./diff";

interface StudioProps {
  studio?: Studio | null;
  callback: (data: StudioEditDetailsInput, editNote: string) => void;
  showNetworkSelect?: boolean;
  initial?: InitialStudio;
  saving: boolean;
}

const StudioForm: FC<StudioProps> = ({
  studio,
  callback,
  showNetworkSelect = true,
  initial,
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
      name: initial?.name ?? studio?.name,
      images: initial?.images ?? studio?.images ?? [],
      urls: initial?.urls ?? studio?.urls ?? [],
      parent: initial?.parent ?? studio?.parent,
    },
  });

  const [file, setFile] = useState<File | undefined>();
  const fieldData = watch();
  const [oldStudioChanges, newStudioChanges] = useMemo(
    () =>
      DiffStudio(
        StudioSchema.cast(fieldData, {
          assert: "ignore-optionality",
        }) as StudioFormData,
        studio
      ),
    [fieldData, studio]
  );

  const [activeTab, setActiveTab] = useState("details");

  const onSubmit = (data: StudioFormData) => {
    const callbackData: StudioEditDetailsInput = {
      name: data.name,
      urls: data.urls?.map((u) => ({
        url: u.url,
        site_id: u.site.id,
      })),
      image_ids: data.images.map((i) => i.id),
      parent_id: data.parent?.id,
    };
    callback(callbackData, data.note);
  };

  const metadataErrors = [
    { error: errors.name?.message, tab: "details" },
    {
      error: errors.urls?.find?.((u) => u?.url?.message)?.url?.message,
      tab: "links",
    },
  ].filter((e) => e.error) as { error: string; tab: string }[];

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
              {...register("name")}
            />
            <Form.Control.Feedback type="invalid">
              {errors?.name?.message}
            </Form.Control.Feedback>
          </Form.Group>

          {showNetworkSelect && (
            <Form.Group controlId="network" className="mb-3">
              <Form.Label>Network</Form.Label>
              <Controller
                name="parent"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <StudioSelect
                    excludeStudio={studio?.id}
                    initialStudio={value}
                    onChange={onChange}
                    isClearable
                    networkSelect
                  />
                )}
              />
            </Form.Group>
          )}

          <NavButtons onNext={() => setActiveTab("links")} />
        </Tab>

        <Tab eventKey="links" title="Links" className="col-xl-9">
          <Form.Group className="mb-3">
            <Form.Label>Links</Form.Label>
            <URLInput
              control={control}
              type={ValidSiteTypeEnum.STUDIO}
              errors={errors.urls}
            />
          </Form.Group>

          <NavButtons onNext={() => setActiveTab("images")} />
        </Tab>

        <Tab eventKey="images" title="Images" className="col-xl-6">
          <EditImages
            control={control}
            maxImages={1}
            file={file}
            setFile={(f) => setFile(f)}
            allowLossless
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
          {renderStudioDetails(newStudioChanges, oldStudioChanges, !!studio)}
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

          <SubmitButtons disabled={!!file || saving} />
        </Tab>
      </Tabs>
    </Form>
  );
};

export default StudioForm;
