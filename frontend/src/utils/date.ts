import { FuzzyDateInput, DateAccuracyEnum } from "src/definitions/globalTypes";

const getFuzzyDate = (date: FuzzyDateInput) => {
  if (date === null) return "";
  if (date.accuracy === DateAccuracyEnum.DAY) return date.date;
  if (date.accuracy === DateAccuracyEnum.MONTH) return date.date.slice(0, 7);
  return date.date.slice(0, 4);
};

export default getFuzzyDate;
