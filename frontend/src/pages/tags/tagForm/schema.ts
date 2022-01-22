import * as yup from "yup";

export const TagSchema = yup.object({
  name: yup.string().trim().required("Name is required"),
  description: yup.string().trim(),
  aliases: yup.array().of(yup.string().trim().required()).ensure(),
  categoryId: yup.string().nullable().defined(),
  note: yup.string().required("Edit note is required"),
});

export type TagFormData = yup.Asserts<typeof TagSchema>;
export type CastedTagFormData = yup.TypeOf<typeof TagSchema>;
