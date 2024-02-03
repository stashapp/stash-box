import * as yup from "yup";
import { addYears } from "date-fns";
import { GenderEnum } from "src/graphql";
import { isValidDate, dateWithinRange } from "src/utils";

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;

export const SceneSchema = yup.object({
  title: yup.string().trim().required("Title is required"),
  details: yup.string().trim(),
  date: yup
    .string()
    .trim()
    .defined()
    .transform(nullCheck)
    .matches(/^\d{4}$|^\d{4}-\d{2}$|^\d{4}-\d{2}-\d{2}$/, {
      excludeEmptyString: true,
      message: "Invalid date, must be YYYY, YYYY-MM, or YYYY-MM-DD",
    })
    .test("valid-date", "Invalid date", isValidDate)
    .test("date-outside-range", "Outside of range", (date) =>
      dateWithinRange(date, "1900-01-01", addYears(new Date(), 1))
    )
    .nullable()
    .required("Release date is required"),
  duration: yup
    .string()
    .trim()
    .matches(/^((\d+:)?([0-5]?\d):)?([0-5]?\d)$/, {
      excludeEmptyString: true,
      message: "Invalid duration, format should be HH:MM:SS",
    })
    .nullable(),
  director: yup.string().trim().transform(nullCheck).nullable(),
  code: yup.string().trim().transform(nullCheck).nullable(),
  studio: yup
    .object({
      id: yup.string().required(),
      name: yup.string().required(),
    })
    .nullable()
    .required("Studio is required"),
  performers: yup
    .array()
    .of(
      yup
        .object({
          performerId: yup.string().required(),
          name: yup.string().required(),
          disambiguation: yup.string().nullable(),
          alias: yup.string().trim().transform(nullCheck).nullable(),
          aliases: yup.array().of(yup.string().required()).nullable(),
          gender: yup
            .string()
            .nullable()
            .oneOf([null, ...Object.keys(GenderEnum)]),
          deleted: yup.bool().required(),
        })
        .transform((s: { name?: string; alias?: string }) => ({
          ...s,
          alias: s.name === s?.alias?.trim() ? undefined : s?.alias?.trim(),
        }))
        .required()
    )
    .ensure(),
  tags: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        name: yup.string().required(),
        description: yup.string().nullable().optional(),
        aliases: yup.array().of(yup.string().required()).defined(),
      })
    )
    .ensure(),
  fingerprints: yup
    .array()
    .of(
      yup
        .object({
          hash: yup.string().required(),
          algorithm: yup.string().required(),
          duration: yup.number().required(),
        })
        .required()
    )
    .ensure(),
  images: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        url: yup.string().required(),
        width: yup.number().required(),
        height: yup.number().required(),
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

export type SceneFormData = yup.Asserts<typeof SceneSchema>;
