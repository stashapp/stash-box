-- Transform scene date columns to single string column
ALTER TABLE "scenes" RENAME COLUMN "date" TO "date_old";
ALTER TABLE "scenes" ADD COLUMN "date" TEXT;

UPDATE "scenes" SET "date" = (
  CASE
    WHEN "date_accuracy" = 'DAY' THEN TO_CHAR("date_old", 'YYYY-MM-DD')
    WHEN "date_accuracy" = 'MONTH' THEN TO_CHAR("date_old", 'YYYY-MM')
    WHEN "date_accuracy" = 'YEAR' THEN TO_CHAR("date_old", 'YYYY')
  END
);

ALTER TABLE "scenes" DROP COLUMN "date_old";
ALTER TABLE "scenes" DROP COLUMN "date_accuracy";

-- Transform performers birthdate columns to single string column
ALTER TABLE "performers" RENAME COLUMN "birthdate" TO "birthdate_old";
ALTER TABLE "performers" ADD COLUMN "birthdate" TEXT;

UPDATE "performers" SET "birthdate" = (
  CASE
    WHEN "birthdate_accuracy" = 'DAY' THEN TO_CHAR("birthdate_old", 'YYYY-MM-DD')
    WHEN "birthdate_accuracy" = 'MONTH' THEN TO_CHAR("birthdate_old", 'YYYY-MM')
    WHEN "birthdate_accuracy" = 'YEAR' THEN TO_CHAR("birthdate_old", 'YYYY')
  END
);

ALTER TABLE "performers" DROP COLUMN "birthdate_old";
ALTER TABLE "performers" DROP COLUMN "birthdate_accuracy";
