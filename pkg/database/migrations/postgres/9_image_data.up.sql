ALTER TABLE "images" ADD COLUMN "checksum" varchar(255);
ALTER TABLE "images" ALTER COLUMN "url" DROP NOT NULL;

CREATE UNIQUE INDEX "images_checksum_idx" ON "images" ("checksum");
