import * as yup from "yup";
import { GenderEnum } from "src/graphql";
import { isValidDate } from "src/utils";

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;

export const SceneSchema = yup.object({
  title: yup.string().trim().required("Title is required"),
  details: yup.string().trim(),
  date: yup
    .string()
    .defined()
    .transform(nullCheck)
    .matches(/^\d{4}$|^\d{4}-\d{2}$|^\d{4}-\d{2}-\d{2}$/, {
      excludeEmptyString: true,
      message: "Invalid date, must be YYYY, YYYY-MM, or YYYY-MM-DD",
    })
    .test("valid-date", "Invalid date", isValidDate)
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
  code: yup.string().trim().transform(nullCheck).nullable(),
  studio: yup
    .object({
      id: yup.string().required("Studio is required"),
      name: yup.string().required(),
    })
    .nullable()
    .required(),
  performers: yup
    .array()
    .of(
      yup
        .object({
          performerId: yup.string().required(),
          name: yup.string().required(),
          disambiguation: yup.string().nullable(),
          alias: yup.string().trim().transform(nullCheck).nullable(),
          gender: yup
            .string()
            .oneOf([null, ...Object.keys(GenderEnum)])
            .nullable(),
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
export type CastedSceneFormData = yup.TypeOf<typeof SceneSchema>;
