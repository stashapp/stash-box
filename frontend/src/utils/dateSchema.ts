import type { Temporal } from "temporal-polyfill";
import * as yup from "yup";

import { partialDateError } from "./date";

export const partialDateSchema = (end: Temporal.PlainDate) =>
  yup
    .string()
    .trim()
    .transform((input: string | null) =>
      input === "" || input === "null" ? null : input,
    )
    .test("partial-date", (date, context) => {
      const message = partialDateError(date, end);
      return message ? context.createError({ message }) : true;
    })
    .nullable();
