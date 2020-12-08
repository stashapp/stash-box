import React, { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers";
import Select from "react-select";
import { Button, Col, Form, Tabs, Tab } from "react-bootstrap";
import * as yup from "yup";
import Countries from "i18n-iso-countries";
import english from "i18n-iso-countries/langs/en.json";
import cx from "classnames";
import { sortBy } from "lodash";

import {
  GenderEnum,
  HairColorEnum,
  EyeColorEnum,
  BreastTypeEnum,
  EthnicityEnum,
  DateAccuracyEnum,
  PerformerEditDetailsInput,
} from "src/definitions/globalTypes";
import { getBraSize, formatFuzzyDate } from "src/utils";
import {
  Performer_findPerformer as Performer,
  Performer_findPerformer_images as PerformerImage,
} from "src/definitions/Performer";

import { BodyModification, Image } from "src/components/form";
import MultiSelect from "src/components/multiSelect";
import ChangeRow from "src/components/changeRow";
import DiffPerformer from "./diff";

Countries.registerLocale(english);
const CountryList = Countries.getNames("en");

type OptionEnum = {
  value: string;
  label: string;
};

const GENDER: OptionEnum[] = [
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

const getEnumValue = (enumArray: OptionEnum[], val: string) => {
  if (val === null) return enumArray[0].value;

  return val;
};

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;
const zeroCheck = (input: number | null) =>
  input === 0 || Number.isNaN(input) ? null : input;

const schema = yup.object().shape({
  id: yup.string(),
  name: yup.string().required("Name is required"),
  gender: yup
    .string()
    .oneOf(Object.keys(GenderEnum), "Invalid gender")
    .required("Gender is required"),
  disambiguation: yup.string().trim().transform(nullCheck).nullable(),
  birthdate: yup
    .string()
    .transform(nullCheck)
    .matches(/^\d{4}$|^\d{4}-\d{2}$|^\d{4}-\d{2}-\d{2}$/, {
      excludeEmptyString: true,
      message: "Invalid date, must be YYYY, YYYY-MM, or YYYY-MM-DD",
    })
    .nullable(),
  career_start_year: yup
    .number()
    .transform(zeroCheck)
    .nullable()
    .min(1950, "Invalid year")
    .max(new Date().getFullYear(), "Invalid year"),
  career_end_year: yup
    .number()
    .transform(zeroCheck)
    .min(1950, "Invalid year")
    .max(new Date().getFullYear(), "Invalid year")
    .nullable(),
  height: yup
    .number()
    .transform(zeroCheck)
    .min(100, "Invalid height, Height must be in centimeters.")
    .max(230, "Invalid height")
    .nullable(),
  braSize: yup
    .string()
    .transform(nullCheck)
    .matches(
      /\d{2,3}[a-zA-Z]{1,4}/,
      "Invalid cup size. Only american sizes are accepted."
    )
    .nullable(),
  waistSize: yup
    .number()
    .transform(zeroCheck)
    .min(15, "Invalid waist size")
    .max(50, "Invalid waist size")
    .nullable(),
  hipSize: yup.number().transform(zeroCheck).nullable(),
  boobJob: yup
    .string()
    .transform(nullCheck)
    .nullable()
    .oneOf([...Object.keys(BreastTypeEnum), null], "Invalid breast type"),
  country: yup.string().trim().transform(nullCheck).nullable(),
  ethnicity: yup
    .string()
    .transform(nullCheck)
    .nullable()
    .oneOf([...Object.keys(EthnicityEnum), null], "Invalid ethnicity"),
  eye_color: yup
    .string()
    .transform(nullCheck)
    .nullable()
    .oneOf([null, ...Object.keys(EyeColorEnum)], "Invalid eye color"),
  hair_color: yup
    .string()
    .transform(nullCheck)
    .nullable()
    .oneOf([null, ...Object.keys(HairColorEnum)], "Invalid hair color"),
  tattoos: yup
    .array()
    .of(
      yup.object().shape({
        location: yup.string().required("Location is required"),
        description: yup.string().transform(nullCheck).nullable(),
      })
    )
    .nullable(),
  piercings: yup
    .array()
    .of(
      yup.object({
        location: yup.string().required("Location is required"),
        description: yup.string().transform(nullCheck).nullable(),
      })
    )
    .nullable(),
  aliases: yup.array().of(yup.string().trim().transform(nullCheck)),
  images: yup
    .array()
    .of(yup.string().trim().transform(nullCheck))
    .transform((_, obj) => Object.keys(obj ?? [])),
  note: yup.string().transform(nullCheck).nullable(),
});

export type PerformerFormData = yup.InferType<typeof schema>;

interface PerformerProps {
  performer: Performer;
  callback: (
    data: PerformerEditDetailsInput,
    note?: string,
    id?: string
  ) => void;
  initialAliases?: string[];
  initialImages?: PerformerImage[];
}

const PerformerForm: React.FC<PerformerProps> = ({
  performer,
  callback,
  initialAliases = [],
  initialImages = [],
}) => {
  const { register, control, handleSubmit, errors, watch } = useForm<
    PerformerFormData
  >({
    resolver: yupResolver(schema),
    mode: "onBlur",
  });
  const [gender, setGender] = useState(performer.gender || "FEMALE");
  const [images, setImages] = useState([...performer.images, ...initialImages]);
  const aliases = [...performer.aliases, ...initialAliases];
  const [activeTab, setActiveTab] = useState("personal");
  const fieldData = watch();
  const changes = useMemo(
    () => DiffPerformer(performer, schema.cast(fieldData)),
    [fieldData, performer]
  );
  const history = useHistory();

  const onGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setGender(e.currentTarget.value);

  const enumOptions = (enums: OptionEnum[]) =>
    enums.map((obj) => (
      <option key={obj.value} value={obj.value}>
        {obj.label}
      </option>
    ));

  const handleRemoveImage = (id: string) => {
    setImages(images.filter((i) => i.id !== id));
  };

  const onSubmit = (data: PerformerFormData) => {
    const performerData: PerformerEditDetailsInput = {
      name: data.name,
      disambiguation: data.disambiguation,
      gender: GenderEnum[data.gender as keyof typeof GenderEnum],
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
      aliases: data.aliases ? data.aliases.map((p: string) => p.trim()) : null,
      piercings: data.piercings,
      tattoos: data.tattoos,
      breast_type: BreastTypeEnum[data.boobJob as keyof typeof BreastTypeEnum],
      image_ids: data.images,
    };

    performerData.measurements = {
      cup_size: "",
      band_size: 0,
      waist: data.waistSize ?? 0,
      hip: data.hipSize ?? 0,
    };
    if (data.braSize != null) {
      const band = data.braSize.match(/^\d+/)?.[0];
      const bandSize = band ? Number.parseInt(band, 10) : null;
      const cup = bandSize
        ? data.braSize.replace(bandSize.toString(), "")
        : null;
      const braSize = cup
        ? cup.match(/^[a-zA-Z]+/)?.[0]?.toUpperCase() ?? null
        : null;
      performerData.measurements.cup_size = braSize;
      performerData.measurements.band_size = bandSize ?? 0;
    }
    if (
      data.gender === GenderEnum.MALE ||
      data.gender === GenderEnum.TRANSGENDER_MALE
    )
      performerData.breast_type = BreastTypeEnum.NA;
    if (data.birthdate !== null)
      if (data.birthdate.length === 10)
        performerData.birthdate = {
          date: data.birthdate,
          accuracy: DateAccuracyEnum.DAY,
        };
      else if (data.birthdate.length === 7)
        performerData.birthdate = {
          date: `${data.birthdate}-01`,
          accuracy: DateAccuracyEnum.MONTH,
        };
      else
        performerData.birthdate = {
          date: `${data.birthdate}-01-01`,
          accuracy: DateAccuracyEnum.YEAR,
        };

    callback(performerData, data.note ?? undefined, data.id);
  };

  const countryObj = [
    { label: "Unknown", value: "" },
    ...sortBy(
      Object.keys(CountryList).map((name: string) => {
        const countryName: string = Array.isArray(CountryList[name])
          ? CountryList[name][0]
          : (CountryList[name] as string);
        return {
          label: countryName,
          value: Countries.getAlpha2Code(countryName, "en"),
        };
      }),
      "label"
    ),
  ];

  return (
    <Form className="PerformerForm" onSubmit={handleSubmit(onSubmit)}>
      <input
        type="hidden"
        name="id"
        value={performer.id}
        ref={register({ required: true })}
      />
      <Tabs activeKey={activeTab} onSelect={(key) => key && setActiveTab(key)}>
        <Tab eventKey="personal" title="Personal Information">
          <Form.Row>
            <Form.Group controlId="name" className="col-6">
              <Form.Label>Name</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.name })}
                defaultValue={performer.name}
                name="name"
                ref={register({ required: true })}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.name?.message}
              </Form.Control.Feedback>
              <Form.Text>The primary name used by the performer.</Form.Text>
            </Form.Group>
            <Form.Group controlId="disambiguation" className="col-6">
              <Form.Label>Disambiguation</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.disambiguation })}
                defaultValue={performer.disambiguation ?? ""}
                name="disambiguation"
                ref={register}
              />
              <Form.Text>Required if the primary name is not unique.</Form.Text>
              <Form.Control.Feedback type="invalid">
                {errors?.disambiguation?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Form.Row>

          <Form.Row>
            <Form.Group controlId="aliases" className="col">
              <Form.Label>Aliases</Form.Label>
              <Controller
                control={control}
                name="aliases"
                defaultValue={aliases}
                render={({ onChange }) => (
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
          </Form.Row>

          <Form.Row>
            <Form.Group controlId="gender" className="col-6">
              <Form.Label>Gender</Form.Label>
              <Form.Control
                as="select"
                className={cx({ "is-invalid": errors.gender })}
                name="gender"
                defaultValue={performer?.gender ?? ""}
                onChange={onGenderChange}
                ref={register}
              >
                {enumOptions(GENDER)}
              </Form.Control>
              <Form.Control.Feedback type="invalid">
                {errors?.gender?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="birthdate" className="col-6">
              <Form.Label>Birthdate</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.birthdate })}
                placeholder="YYYY-MM-DD"
                name="birthdate"
                defaultValue={
                  performer.birthdate
                    ? formatFuzzyDate(performer.birthdate)
                    : ""
                }
                ref={register}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.birthdate?.message}
              </Form.Control.Feedback>
              <Form.Text>
                If the precise date is unknown the date and or month can be
                omitted.
              </Form.Text>
            </Form.Group>
          </Form.Row>

          <Form.Row>
            <Form.Group controlId="eye_color" className="col-6">
              <Form.Label>Eye Color</Form.Label>
              <Form.Control
                as="select"
                className={cx({ "is-invalid": errors.eye_color })}
                name="eye_color"
                defaultValue={
                  performer.eye_color
                    ? getEnumValue(EYE, performer.eye_color)
                    : ""
                }
                ref={register}
              >
                {enumOptions(EYE)}
              </Form.Control>
              <Form.Control.Feedback>
                {errors?.eye_color?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="hair_color" className="col-6">
              <Form.Label>Hair Color</Form.Label>
              <Form.Control
                as="select"
                className={cx({ "is-invalid": errors.hair_color })}
                name="hair_color"
                defaultValue={
                  performer.hair_color
                    ? getEnumValue(HAIR, performer.hair_color)
                    : ""
                }
                ref={register}
              >
                {enumOptions(HAIR)}
              </Form.Control>
              <Form.Control.Feedback>
                {errors?.hair_color?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Form.Row>

          <Form.Row>
            <Form.Group controlId="height" className="col-6">
              <Form.Label>Height</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.height })}
                type="number"
                name="height"
                defaultValue={performer?.height ?? ""}
                ref={register}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.height?.message}
              </Form.Control.Feedback>
              <Form.Text>Height in centimeters</Form.Text>
            </Form.Group>

            {(gender === "FEMALE" ||
              gender === "TRANSGENDER_FEMALE" ||
              gender === "INTERSEX") && (
              <Form.Group controlId="boobJob" className="col-6">
                <Form.Label>Breast type</Form.Label>
                <Form.Control
                  as="select"
                  className={cx({ "is-invalid": errors.boobJob })}
                  name="boobJob"
                  defaultValue={
                    performer.breast_type
                      ? getEnumValue(BREAST, performer.breast_type)
                      : ""
                  }
                  ref={register}
                >
                  {enumOptions(BREAST)}
                </Form.Control>
                <Form.Control.Feedback type="invalid">
                  {errors?.boobJob?.message}
                </Form.Control.Feedback>
              </Form.Group>
            )}
          </Form.Row>

          {gender !== GenderEnum.MALE &&
            gender !== GenderEnum.TRANSGENDER_MALE && (
              <Form.Row>
                <Form.Group controlId="braSize" className="col-4">
                  <Form.Label>Bra size</Form.Label>
                  <Form.Control
                    className={cx({ "is-invalid": errors.braSize })}
                    name="braSize"
                    defaultValue={getBraSize(performer.measurements)}
                    ref={register({ pattern: /\d{2,3}[a-zA-Z]{1,4}/i })}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors?.braSize?.message}
                  </Form.Control.Feedback>
                  <Form.Text>US Bra Size</Form.Text>
                </Form.Group>

                <Form.Group controlId="waistSize" className="col-4">
                  <Form.Label>Waist size</Form.Label>
                  <Form.Control
                    className={cx({ "is-invalid": errors.waistSize })}
                    type="number"
                    name="waistSize"
                    defaultValue={performer.measurements.waist ?? ""}
                    ref={register}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors?.waistSize?.message}
                  </Form.Control.Feedback>
                  <Form.Text>Waist circumference in inches</Form.Text>
                </Form.Group>

                <Form.Group controlId="hipSize" className="col-4">
                  <Form.Label>Hip size</Form.Label>
                  <Form.Control
                    className={cx({ "is-invalid": errors.hipSize })}
                    type="number"
                    name="hipSize"
                    defaultValue={performer.measurements.hip ?? ""}
                    ref={register}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors?.hipSize?.message}
                  </Form.Control.Feedback>
                  <Form.Text>Hip circumference in inches</Form.Text>
                </Form.Group>
              </Form.Row>
            )}

          <Form.Row>
            <Form.Group controlId="country" className="col-6">
              <Form.Label>Nationality</Form.Label>
              <Controller
                control={control}
                name="country"
                defaultValue={performer.country}
                render={({ onChange }) => (
                  <Select
                    classNamePrefix="react-select"
                    onChange={(option) =>
                      onChange((option as { value: string })?.value)
                    }
                    options={countryObj}
                    defaultValue={
                      countryObj.find(
                        (country) => country.value === performer.country
                      ) || null
                    }
                  />
                )}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.country?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="ethnicity" className="col-6">
              <Form.Label>Ethnicity</Form.Label>
              <Form.Control
                as="select"
                className={cx({ "is-invalid": errors.ethnicity })}
                name="ethnicity"
                defaultValue={
                  performer.ethnicity
                    ? getEnumValue(ETHNICITY, performer.ethnicity)
                    : ""
                }
                ref={register}
              >
                {enumOptions(ETHNICITY)}
              </Form.Control>
              <Form.Control.Feedback type="invalid">
                {errors?.ethnicity?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Form.Row>

          <Form.Row>
            <Form.Group controlId="career_start_year" className="col-6">
              <Form.Label>Career Start</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.career_start_year })}
                type="year"
                placeholder="Year"
                name="career_start_year"
                defaultValue={performer?.career_start_year ?? ""}
                ref={register}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.career_start_year?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group controlId="career_end_year" className="col-6">
              <Form.Label>Career End</Form.Label>
              <Form.Control
                className={cx({ "is-invalid": errors.career_end_year })}
                type="year"
                placeholder="Year"
                name="career_end_year"
                defaultValue={performer?.career_end_year ?? ""}
                ref={register}
              />
              <Form.Control.Feedback type="invalid">
                {errors?.career_end_year?.message}
              </Form.Control.Feedback>
            </Form.Group>
          </Form.Row>

          <Form.Row>
            <Button
              variant="danger"
              className="ml-auto mr-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button className="mr-1" onClick={() => setActiveTab("bodymod")}>
              Next
            </Button>
          </Form.Row>
        </Tab>

        <Tab eventKey="bodymod" title="Tattoos and Piercings">
          <BodyModification
            control={control}
            name="tattoos"
            locationPlaceholder="Add a tattoo for a location..."
            descriptionPlaceholder="Tattoo description..."
            formatLabel={(text) => `Add tattoo for location "${text}"`}
            defaultValues={performer?.tattoos ?? []}
          />

          <BodyModification
            control={control}
            name="piercings"
            locationPlaceholder="Add a piercing for a location..."
            descriptionPlaceholder="Piercing description..."
            formatLabel={(text) => `Add piercing for location "${text}"`}
            defaultValues={performer?.piercings ?? []}
          />

          <Form.Row className="mt-3">
            <Button
              variant="danger"
              className="ml-auto mr-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button className="mr-1" onClick={() => setActiveTab("images")}>
              Next
            </Button>
          </Form.Row>
        </Tab>

        <Tab eventKey="images" title="Images">
          <Form.Row>
            {images.length === 0 && <h4>No images found.</h4>}
            {
              // Set index and sort from largest to smallest
              sortBy(
                images.map((image, i) => ({ ...image, index: i })),
                (i) => (i?.width ?? 1) * (i.height ?? 1)
              )
                .reverse()
                .map((image) => (
                  <Image
                    image={image}
                    control={control}
                    onRemove={handleRemoveImage}
                  />
                ))
            }
          </Form.Row>

          <Form.Row className="mt-1">
            <Button
              variant="danger"
              className="ml-auto mr-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button className="mr-1" onClick={() => setActiveTab("confirm")}>
              Next
            </Button>
          </Form.Row>
        </Tab>

        <Tab eventKey="confirm" title="Confirm" className="mt-2">
          {changes.length > 0 && (
            <Form.Row>
              <h6 className="col-5 offset-2">Remove</h6>
              <h6 className="col-5">Add</h6>
            </Form.Row>
          )}
          {changes.length === 0 && <h6>No changes.</h6>}
          {changes.map((c) => (
            <ChangeRow {...c} />
          ))}
          <Form.Row className="my-4">
            <Col md={{ span: 6, offset: 6 }}>
              <Form.Label>Edit Note</Form.Label>
              <Form.Control as="textarea" name="note" ref={register} />
              <Form.Text>
                Please add any relevant sources or other supporting information
                for your edit.
              </Form.Text>
            </Col>
          </Form.Row>
          <Form.Row className="mt-2">
            <Button
              variant="danger"
              className="ml-auto mr-2"
              onClick={() => history.goBack()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={changes.length === 0}>
              Submit Edit
            </Button>
          </Form.Row>
        </Tab>
      </Tabs>
    </Form>
  );
};

export default PerformerForm;
