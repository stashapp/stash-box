import { GenderEnum } from "src/graphql";
import * as yup from "yup";

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;

export const GallerySchema = yup.object({
  title: yup.string().trim().required("Title is required"),
  code: yup.string().trim().transform(nullCheck).nullable(),
  date: yup
    .string()
    .trim()
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD")
    .required("Date is required"),
  photographer: yup.string().trim().transform(nullCheck).nullable(),
  details: yup.string().trim().transform(nullCheck).nullable(),
  studio: yup
    .object({ id: yup.string().required(), name: yup.string().required() })
    .nullable()
    .required("Studio is required"),
  performers: yup
    .array()
    .of(
      yup.object({
        performerId: yup.string().required(),
        name: yup.string().required(),
        alias: yup.string().trim().transform(nullCheck).nullable(),
        aliases: yup.array().of(yup.string().required()).nullable(),
        gender: yup
          .mixed<GenderEnum>()
          .nullable()
          .oneOf([null, ...Object.values(GenderEnum)]),
        disambiguation: yup.string().nullable(),
        deleted: yup.boolean().required(),
      }),
    )
    .ensure(),
  scenes: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        title: yup.string().nullable(),
        release_date: yup.string().nullable(),
        deleted: yup.boolean().required(),
      }),
    )
    .ensure(),
  tags: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        name: yup.string().required(),
        aliases: yup.array().of(yup.string().required()).defined(),
      }),
    )
    .ensure(),
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
      }),
    )
    .ensure(),
  cover: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        url: yup.string().required(),
        width: yup.number().required(),
        height: yup.number().required(),
      }),
    )
    .required()
    .max(1),
  images: yup
    .array()
    .of(
      yup.object({
        index: yup.number().integer().min(1).required(),
        phash: yup
          .string()
          .matches(/^[0-9a-fA-F]{16}$/, "PHash must be 16 hexadecimal digits")
          .required("PHash is required"),
        tags: yup
          .array()
          .of(
            yup.object({
              id: yup.string().required(),
              name: yup.string().required(),
              aliases: yup.array().of(yup.string().required()).defined(),
            }),
          )
          .ensure(),
      }),
    )
    .ensure(),
  note: yup.string().required("Edit note is required"),
});

export type GalleryFormData = yup.Asserts<typeof GallerySchema>;
