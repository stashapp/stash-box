ALTER TABLE "images" ADD COLUMN "checksum" varchar(255) NOT NULL;
ALTER TABLE "images" ALTER COLUMN "url" DROP NOT NULL;
ALTER TABLE "images" ALTER COLUMN "width" SET NOT NULL;
ALTER TABLE "images" ALTER COLUMN "height" SET NOT NULL;

CREATE UNIQUE INDEX "images_checksum_idx" ON "images" ("checksum");
