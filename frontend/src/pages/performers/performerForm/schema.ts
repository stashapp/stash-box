import * as yup from "yup";

import {
  GenderEnum,
  HairColorEnum,
  EyeColorEnum,
  BreastTypeEnum,
  EthnicityEnum,
} from "src/graphql";

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;
const zeroCheck = (input: number | null) =>
  input === 0 || Number.isNaN(input) ? null : input;

export const PerformerSchema = yup.object({
  id: yup.string(),
  name: yup.string().trim().required("Name is required"),
  gender: yup
    .string()
    .transform((val) => (val === "null" ? null : val))
    .nullable()
    .oneOf([null, ...Object.keys(GenderEnum)], "Gender is required"),
  disambiguation: yup.string().trim().transform(nullCheck).nullable(),
  birthdate: yup
    .string()
    .defined()
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
  breastType: yup
    .string()
    .transform(nullCheck)
    .nullable()
    .oneOf([...Object.keys(BreastTypeEnum), null], "Invalid breast type"),
  country: yup.string().trim().transform(nullCheck).nullable().defined(),
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
  tattoos: yup.array().of(
    yup.object({
      location: yup.string().trim().required("Location is required"),
      description: yup.string().trim().transform(nullCheck).nullable(),
    })
  ),
  piercings: yup.array().of(
    yup.object({
      location: yup.string().trim().required("Location is required"),
      description: yup.string().trim().transform(nullCheck).nullable(),
    })
  ),
  aliases: yup
    .array()
    .of(yup.string().trim().transform(nullCheck).required())
    .required(),
  images: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        url: yup.string().required(),
      })
    )
    .required(),
  urls: yup
    .array()
    .of(
      yup.object({
        url: yup.string().url("Invalid URL").required(),
        site: yup
          .object({
            id: yup.string().required(),
            name: yup.string().required(),
            icon: yup.string().required(),
          })
          .required(),
      })
    )
    .ensure(),
  note: yup.string().required("Edit note is required"),
});

export type PerformerFormData = yup.Asserts<typeof PerformerSchema>;
export type CastedPerformerFormData = yup.TypeOf<typeof PerformerSchema>;
