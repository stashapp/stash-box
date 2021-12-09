import * as yup from "yup";

const nullCheck = (input: string | null) =>
  input === "" || input === "null" ? null : input;

export const StudioSchema = yup.object({
  name: yup.string().required("Name is required"),
  url: yup.string().url("Invalid URL").transform(nullCheck).nullable(),
  images: yup
    .array()
    .of(
      yup.object({
        id: yup.string().required(),
        url: yup.string().required(),
      })
    )
    .required(),
  studio: yup
    .object({
      id: yup.string().required(),
      name: yup.string().required(),
    })
    .optional()
    .default(undefined),
  note: yup.string().required("Edit note is required"),
});

export type StudioFormData = yup.Asserts<typeof StudioSchema>;
export type CastedStudioFormData = yup.TypeOf<typeof StudioSchema>;
