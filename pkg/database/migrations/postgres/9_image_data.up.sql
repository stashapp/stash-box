ALTER TABLE "images" ADD COLUMN "checksum" varchar(255);

CREATE UNIQUE INDEX "images_checksum_idx" ON "images" ("checksum");
