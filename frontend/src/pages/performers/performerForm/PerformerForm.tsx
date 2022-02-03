import { FC, useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Select from "react-select";
import { Col, Form, Row, Tabs, Tab } from "react-bootstrap";
import Countries from "i18n-iso-countries";
import english from "i18n-iso-countries/langs/en.json";
import cx from "classnames";
import { sortBy, uniq, uniqBy } from "lodash-es";
import { Link } from "react-router-dom";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";

import {
  GenderEnum,
  HairColorEnum,
  EyeColorEnum,
  BreastTypeEnum,
  EthnicityEnum,
  PerformerEditDetailsInput,
  ValidSiteTypeEnum,
} from "src/graphql";
import {
  getBraSize,
  parseBraSize,
  formatFuzzyDate,
  parseFuzzyDate,
} from "src/utils";
import { Performer_findPerformer as Performer } from "src/graphql/definitions/Performer";
import { ImageFragment } from "src/graphql/definitions/ImageFragment";

import { renderPerformerDetails } from "src/components/editCard/ModifyEdit";
import { Help, Icon } from "src/components/fragments";
import {
  BodyModification,
  EditNote,
  NavButtons,
  SubmitButtons,
} from "src/components/form";
import MultiSelect from "src/components/multiSelect";
import EditImages from "src/components/editImages";
import DiffPerformer from "./diff";
import { PerformerSchema, PerformerFormData } from "./schema";
import URLInput from "src/components/urlInput";

Countries.registerLocale(english);
const CountryList = Countries.getNames("en");

type OptionEnum = {
  value: string;
  label: string;
};

const GENDER: OptionEnum[] = [
  { value: "null", label: "Unknown" },
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "TRANSGENDER_FEMALE", label: "Transfemale" },
  { value: "TRANSGENDER_MALE", label: "Transmale" },
  { value: "INTERSEX", label: "Intersex" },
];

const HAIR: OptionEnum[] = [
  { value: "null", label: "Unknown" },
  { value: "BLONDE", label: "Blonde" },
  { value: "BRUNETTE", label: "Brunette" },
  { value: "BLACK", label: "Black" },
  { value: "RED", label: "Red" },
  { value: "AUBURN", label: "Auburn" },
  { value: "GREY", label: "Grey" },
  { value: "BALD", label: "Bald" },
  { value: "VARIOUS", label: "Various" },
  { value: "OTHER", label: "Other" },
];

const BREAST: OptionEnum[] = [
  { value: "null", label: "Unknown" },
  { value: "NATURAL", label: "Natural" },
  { value: "FAKE", label: "Augmented" },
  { value: "NA", label: "N/A" },
];

const EYE: OptionEnum[] = [
  { value: "null", label: "Unknown" },
  { value: "BLUE", label: "Blue" },
  { value: "BROWN", label: "Brown" },
  { value: "GREY", label: "Grey" },
  { value: "GREEN", label: "Green" },
  { value: "HAZEL", label: "Hazel" },
  { value: "RED", label: "Red" },
];

const ETHNICITY: OptionEnum[] = [
  { value: "null", label: "Unknown" },
  { value: "CAUCASIAN", label: "Caucasian" },
  { value: "BLACK", label: "Black" },
  { value: "ASIAN", label: "Asian" },
  { value: "INDIAN", label: "Indian" },
  { value: "LATIN", label: "Latino" },
  { value: "MIDDLE_EASTERN", label: "Middle Eastern" },
  { value: "MIXED", label: "Mixed" },
  { value: "OTHER", label: "Other" },
];

const UPDATE_ALIAS_MESSAGE = `Enabling this option sets the current name as an alias on every scene that this performer does not have an alias on.
In most cases, it should be enabled when renaming a performer to a different alias, and disabled when correcting a typo in the name.
`;

const getEnumValue = (enumArray: OptionEnum[], val: string) => {
  if (val === null) return enumArray[0].value;

  return val;
};

interface PerformerProps {
  performer: Performer;
  callback: (
    data: PerformerEditDetailsInput,
    note: string,
    updateAliases: boolean,
    id?: string
  ) => void;
  initialAliases?: string[];
  initialImages?: ImageFragment[];
  initial?: Performer;
  changeType: "modify" | "create" | "merge";
  saving: boolean;
}

const PerformerForm: FC<PerformerProps> = ({
  performer,
  callback,
  initialAliases = [],
  initialImages = [],
  initial,
  saving,
}) => {
  const images = uniqBy(
    [...performer.images, ...initialImages, ...(initial?.images ?? [])],
    (i) => i.id
  );
  const tattoos = (performer?.tattoos ?? []).map(
    ({ __typename, ...mod }) => mod
  );
  const piercings = (performer?.piercings ?? []).map(
    ({ __typename, ...mod }) => mod
  );
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PerformerFormData>({
    resolver: yupResolver(PerformerSchema),
    mode: "onBlur",
    defaultValues: {
      tattoos,
      piercings,
      images,
      urls: performer.urls ?? [],
    },
  });

  const aliases = uniq([
    ...performer.aliases,
    ...initialAliases,
    ...(initial?.aliases ?? []),
  ]);
  const [activeTab, setActiveTab] = useState("personal");
  const [updateAliases, setUpdateAliases] = useState(false);
  const [file, setFile] = useState<File | undefined>();

  const fieldData = watch();
  const [oldChanges, newChanges] = useMemo(
    () => DiffPerformer(PerformerSchema.cast(fieldData), performer),
    [fieldData, performer]
  );

  const changedName =
    !!performer.id &&
    fieldData.name !== undefined &&
    performer.name !== fieldData.name;

  useEffect(() => {
    setUpdateAliases(changedName);
  }, [changedName, setUpdateAliases]);

  const showBreastType =
    fieldData.gender !== GenderEnum.MALE &&
    fieldData.gender !== GenderEnum.TRANSGENDER_MALE;
  // Update breast type based on gender
  useEffect(() => {
    if (!showBreastType) setValue("boobJob", BreastTypeEnum.NA);
  }, [showBreastType, setValue]);

  const enumOptions = (enums: OptionEnum[]) =>
    enums.map((obj) => (
      <option key={obj.value} value={obj.value}>
        {obj.label}
      </option>
    ));

  const onSubmit = (data: PerformerFormData) => {
    const performerData: PerformerEditDetailsInput = {
      name: data.name,
      disambiguation: data.disambiguation,
      gender: GenderEnum[data.gender as keyof typeof GenderEnum] || null,
      eye_color:
        EyeColorEnum[data.eye_color as keyof typeof EyeColorEnum] || null,
      hair_color:
        HairColorEnum[data.hair_color as keyof typeof HairColorEnum] || null,
      career_start_year: data.career_start_year,
      career_end_year: data.career_end_year,
      height: data.height,
      ethnicity:
        EthnicityEnum[data.ethnicity as keyof typeof EthnicityEnum] || null,
      country: data.country,
      aliases: data.aliases.map((p: string) => p.trim()),
      piercings: data.piercings ?? [],
      tattoos: data.tattoos ?? [],
      breast_type:
        BreastTypeEnum[data.boobJob as keyof typeof BreastTypeEnum] || null,
      image_ids: data.images.map((i) => i.id),
      urls: data.urls.map((u) => ({
        url: u.url,
        site_id: u.site.id,
      })),
    };

    performerData.measurements = {
      cup_size: null,
      band_size: null,
      waist: data.waistSize ?? null,
      hip: data.hipSize ?? null,
    };
    if (data.braSize != null) {
      const [cupSize, bandSize] = parseBraSize(data.braSize);
      performerData.measurements.cup_size = cupSize;
      performerData.measurements.band_size = bandSize ?? 0;
    }

    if (
      data.gender === GenderEnum.MALE ||
      data.gender === GenderEnum.TRANSGENDER_MALE
    )
      performerData.breast_type = BreastTypeEnum.NA;

    performerData.birthdate = parseFuzzyDate(data.birthdate);

    callback(performerData, data.note, updateAliases, data.id);
  };

  const countryObj = [
    { label: "Unknown", value: "" },
    ...sortBy(
      Object.keys(CountryList).map((name: string) => {
        const countryName: string = Array.isArray(CountryList[name])
          ? CountryList[name][0]
          : CountryList[name];
        return {
          label: countryName,
          value: Countries.getAlpha2Code(countryName, "en"),
        };
      }),
      "label"
    ),
  ];

  const metadataErrors = [
    { error: errors.name?.message, tab: "personal" },
    { error: errors.birthdate?.message, tab: "personal" },
    { error: errors.career_start_year?.message, tab: "personal" },
    { error: errors.career_end_year?.message, tab: "personal" },
    { error: errors.height?.message, tab: "personal" },
    { error: errors.braSize?.message, tab: "personal" },
    { error: errors.waistSize?.message, tab: "personal" },
    {
      error: errors.urls?.find((u) => u?.url?.message)?.url?.message,
      tab: "links",
    },
  ].filter((e) => e.error) as { error: string; tab: string }[];

  return (
    <Form className="PerformerForm" onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" value={performer.id} {...register("id")} />
      <Tabs
        activeKey={activeTab}
        onSelect={(key) => key && setActiveTab(key)}
        className="d-flex"
      >
        <Tab
          eventKey="personal"
          title="Personal Information"
          className="col-xl-9"
        >
          <Row>
            <Form.Group controlId="name" className="col-6 mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.name })}
                defaultValue={initial?.name ?? performer.name}
                {...register("name", { required: true })}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.name?.message}
              </Form.Control.Feedback>
              <Form.Text>The primary name used by the performer.</Form.Text>
            </Form.Group>
            <Form.Group controlId="disambiguation" className="col-6 mb-3">
              <Form.Label>Disambiguation</Form.Label>
              <Form.Control
                defaultValue={performer.disambiguation ?? ""}
                {...register("disambiguation")}
              />
              <Form.Text>Required if the primary name is not unique.</Form.Text>
            </Form.Group>
          </Row>

          {changedName && (
            <Row>
              <Form.Group className="col mb-3">
                <Form.Check
                  id="update-modify-aliases"
                  checked={updateAliases}
                  onChange={() => setUpdateAliases(!updateAliases)}
                  label="Set unset performance aliases to old name"
                  className="d-inline-block"
                />
                <Help message={UPDATE_ALIAS_MESSAGE} />
              </Form.Group>
            </Row>
          )}

          <Row>
            <Form.Group controlId="aliases" className="col mb-3">
              <Form.Label>Aliases</Form.Label>
              <Controller
                control={control}
                name="aliases"
                defaultValue={aliases}
                render={({ field: { onChange } }) => (
                  <MultiSelect
                    values={aliases}
                    onChange={onChange}
                    placeholder="Enter name..."
                  />
                )}
              />
              <Form.Text>
                Any names used by the performer different from the primary name.
              </Form.Text>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group controlId="gender" className="col-6 mb-3">
              <Form.Label>Gender</Form.Label>
              <Form.Select
                className={cx({ "is-invalid": errors.gender })}
                defaultValue={initial?.gender ?? performer?.gender ?? ""}
                {...register("gender")}
              >
                {enumOptions(GENDER)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors?.gender?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="birthdate" className="col-6 mb-3">
              <Form.Label>Birthdate</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.birthdate })}
                placeholder="YYYY-MM-DD"
                defaultValue={formatFuzzyDate(
                  initial?.birthdate ?? performer.birthdate
                )}
                {...register("birthdate")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.birthdate?.message}
              </Form.Control.Feedback>
              <Form.Text>
                If the precise date is unknown the day and/or month can be
                omitted.
              </Form.Text>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group controlId="eye_color" className="col-6 mb-3">
              <Form.Label>Eye Color</Form.Label>
              <Form.Select
                className={cx({ "is-invalid": errors.eye_color })}
                defaultValue={
                  initial?.eye_color
                    ? initial.eye_color
                    : performer.eye_color
                    ? getEnumValue(
                        EYE,
                        initial?.eye_color ?? performer.eye_color
                      )
                    : ""
                }
                {...register("eye_color")}
              >
                {enumOptions(EYE)}
              </Form.Select>
              <Form.Control.Feedback>
                {errors?.eye_color?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="hair_color" className="col-6 mb-3">
              <Form.Label>Hair Color</Form.Label>
              <Form.Select
                className={cx({ "is-invalid": errors.hair_color })}
                defaultValue={
                  initial?.hair_color
                    ? initial.hair_color
                    : performer.hair_color
                    ? getEnumValue(HAIR, performer.hair_color)
                    : ""
                }
                {...register("hair_color")}
              >
                {enumOptions(HAIR)}
              </Form.Select>
              <Form.Control.Feedback>
                {errors?.hair_color?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group controlId="height" className="col-6 mb-3">
              <Form.Label>Height</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.height })}
                type="number"
                defaultValue={initial?.height || performer?.height || ""}
                {...register("height")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.height?.message}
              </Form.Control.Feedback>
              <Form.Text>Height in centimeters</Form.Text>
            </Form.Group>

            {fieldData.gender !== "MALE" &&
              fieldData.gender !== "TRANSGENDER_MALE" && (
                <Form.Group controlId="boobJob" className="col-6 mb-3">
                  <Form.Label>Breast type</Form.Label>
                  <Form.Select
                    className={cx({ "is-invalid": errors.boobJob })}
                    defaultValue={
                      performer.breast_type
                        ? getEnumValue(BREAST, performer.breast_type)
                        : ""
                    }
                    {...register("boobJob")}
                  >
                    {enumOptions(BREAST)}
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors?.boobJob?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              )}
          </Row>

          {showBreastType && (
            <Row>
              <Form.Group controlId="braSize" className="col-4 mb-3">
                <Form.Label>Bra size</Form.Label>
                <Form.Control
                  className={cx({ "is-invalid": errors.braSize })}
                  defaultValue={getBraSize(performer.measurements)}
                  {...register("braSize", {
                    pattern: /\d{2,3}[a-zA-Z]{1,4}/i,
                  })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.braSize?.message}
                </Form.Control.Feedback>
                <Form.Text>US Bra Size</Form.Text>
              </Form.Group>

              <Form.Group controlId="waistSize" className="col-4 mb-3">
                <Form.Label>Waist size</Form.Label>
                <Form.Control
                  className={cx({ "is-invalid": errors.waistSize })}
                  type="number"
                  defaultValue={performer.measurements.waist ?? ""}
                  {...register("waistSize")}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.waistSize?.message}
                </Form.Control.Feedback>
                <Form.Text>Waist circumference in inches</Form.Text>
              </Form.Group>

              <Form.Group controlId="hipSize" className="col-4 mb-3">
                <Form.Label>Hip size</Form.Label>
                <Form.Control
                  className={cx({ "is-invalid": errors.hipSize })}
                  type="number"
                  defaultValue={performer.measurements.hip ?? ""}
                  {...register("hipSize")}
                />
                <Form.Control.Feedback type="invalid">
                  {errors?.hipSize?.message}
                </Form.Control.Feedback>
                <Form.Text>Hip circumference in inches</Form.Text>
              </Form.Group>
            </Row>
          )}

          <Row>
            <Form.Group controlId="country" className="col-6 mb-3">
              <Form.Label>Nationality</Form.Label>
              <Controller
                control={control}
                name="country"
                defaultValue={initial?.country ?? performer.country}
                render={({ field: { onChange, value } }) => (
                  <Select
                    classNamePrefix="react-select"
                    onChange={(option) => onChange(option?.value)}
                    options={countryObj}
                    defaultValue={countryObj.find(
                      (country) => country.value === value
                    )}
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.country?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="ethnicity" className="col-6 mb-3">
              <Form.Label>Ethnicity</Form.Label>
              <Form.Select
                className={cx({ "is-invalid": errors.ethnicity })}
                defaultValue={
                  initial?.ethnicity
                    ? initial.ethnicity
                    : performer.ethnicity
                    ? getEnumValue(ETHNICITY, performer.ethnicity)
                    : ""
                }
                {...register("ethnicity")}
              >
                {enumOptions(ETHNICITY)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors?.ethnicity?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <Row>
            <Form.Group controlId="career_start_year" className="col-6 mb-3">
              <Form.Label>Career Start</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.career_start_year })}
                type="year"
                placeholder="Year"
                defaultValue={performer?.career_start_year ?? ""}
                {...register("career_start_year")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.career_start_year?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="career_end_year" className="col-6 mb-3">
              <Form.Label>Career End</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.career_end_year })}
                type="year"
                placeholder="Year"
                defaultValue={performer?.career_end_year ?? ""}
                {...register("career_end_year")}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.career_end_year?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Row>

          <NavButtons onNext={() => setActiveTab("bodymod")} />
        </Tab>

        <Tab
          eventKey="bodymod"
          title="Tattoos and Piercings"
          className="col-xl-9"
        >
          <BodyModification
            control={control}
            name="tattoos"
            locationPlaceholder="Add a tattoo for a location..."
            descriptionPlaceholder="Tattoo description..."
            formatLabel={(text) => `Add tattoo for location "${text}"`}
          />
          <Form.Control.Feedback
            className={cx({ "d-block": errors.tattoos })}
            type="invalid"
          >
            {errors?.tattoos?.map((mod, idx) => (
              <div key={idx}>
                Tattoo {idx + 1}: {mod?.location?.message}
              </div>
            ))}
          </Form.Control.Feedback>

          <BodyModification
            control={control}
            name="piercings"
            locationPlaceholder="Add a piercing for a location..."
            descriptionPlaceholder="Piercing description..."
            formatLabel={(text) => `Add piercing for location "${text}"`}
          />
          <Form.Control.Feedback
            className={cx({ "d-block": errors.piercings })}
            type="invalid"
          >
            {errors?.piercings?.map((mod, idx) => (
              <div key={idx}>
                Piercing {idx + 1}: {mod?.location?.message}
              </div>
            ))}
          </Form.Control.Feedback>

          <NavButtons onNext={() => setActiveTab("links")} />
        </Tab>

        <Tab eventKey="links" title="Links" className="col-xl-9">
          <URLInput
            control={control}
            type={ValidSiteTypeEnum.PERFORMER}
            errors={errors.urls}
          />

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

        <Tab eventKey="confirm" title="Confirm" className="mt-3 col-xl-9">
          {renderPerformerDetails(newChanges, oldChanges, true, updateAliases)}
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

export default PerformerForm;
