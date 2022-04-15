ALTER TABLE "scenes"
ADD COLUMN "date_accuracy" varchar(10);

UPDATE "scenes"
SET "date_accuracy" = 'DAY';
