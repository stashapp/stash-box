CREATE TABLE `performers` (
  `id` integer not null primary key autoincrement,
  `image` blob,
  `name` varchar(255) not null,
  `disambiguation` varchar(255),
  `gender` varchar(20),
  `birthdate` date,
  `birthdate_accuracy` varchar(10),
  `ethnicity` varchar(20),
  `country` varchar(255),
  `eye_color` varchar(10),
  `hair_color` varchar(10),
  `height` integer,
  `cup_size` varchar(5),
  `band_size` integer,
  `hip_size` integer,
  `waist_size` integer,
  `breast_type` varchar(10),
  `career_start_year` integer,
  `career_end_year` integer,
  `created_at` datetime not null,
  `updated_at` datetime not null
);

CREATE TABLE `performer_aliases` (
  `performer_id` integer not null,
  `alias` varchar(255) not null,
  foreign key(`performer_id`) references `performers`(`id`) ON DELETE CASCADE,
  unique (`performer_id`, `alias`)
);

CREATE TABLE `performer_urls` (
  `performer_id` integer not null,
  `url` varchar(255) not null,
  `type` varchar(255) not null,
  foreign key(`performer_id`) references `performers`(`id`) ON DELETE CASCADE,
  unique (`performer_id`, `url`),
  unique (`performer_id`, `type`)
);

CREATE TABLE `performer_piercings` (
  `performer_id` integer not null,
  `location` varchar(255),
  `description` varchar(255),
  foreign key(`performer_id`) references `performers`(`id`) ON DELETE CASCADE,
  unique (`performer_id`, `location`)
);

CREATE TABLE `performer_tattoos` (
  `performer_id` integer not null,
  `location` varchar(255),
  `description` varchar(255),
  foreign key(`performer_id`) references `performers`(`id`) ON DELETE CASCADE,
  unique (`performer_id`, `location`)
);

CREATE INDEX `index_performers_on_name` on `performers` (`name`);
CREATE INDEX `index_performers_on_alias` on `performer_aliases` (`alias`);
CREATE INDEX `index_performers_on_piercing_location` on `performer_piercings` (`location`);
CREATE INDEX `index_performers_on_tattoo_location` on `performer_tattoos` (`location`);
CREATE INDEX `index_performers_on_tattoo_description` on `performer_tattoos` (`description`);
