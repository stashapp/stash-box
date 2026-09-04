import type { Temporal } from "temporal-polyfill";
import * as yup from "yup";

import { isDateInRange, isValidDate, PARTIAL_DATE } from "./date";

export const partialDateSchema = (end: Temporal.PlainDate) =>
  yup
    .string()
    .trim()
    .transform((input: string | null) =>
      input === "" || input === "null" ? null : input,
    )
    .matches(PARTIAL_DATE, {
      excludeEmptyString: true,
      message: "Invalid date, must be YYYY, YYYY-MM, or YYYY-MM-DD",
    })
    .test("valid-date", "Invalid date", isValidDate)
    .test("date-outside-range", "Outside of range", (date) =>
      isDateInRange(date, end),
    )
    .nullable();
