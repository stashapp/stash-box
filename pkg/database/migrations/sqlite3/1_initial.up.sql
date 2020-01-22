CREATE TABLE `performers` (
  `id` blob not null primary key,
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
  `updated_at` datetime not null,
  unique (`name`, `disambiguation`)
);

CREATE TABLE `performer_aliases` (
  `performer_id` blob not null,
  `alias` varchar(255) not null,
  foreign key(`performer_id`) references `performers`(`id`) ON DELETE CASCADE,
  unique (`performer_id`, `alias`)
);

CREATE TABLE `performer_urls` (
  `performer_id` blob not null,
  `url` varchar(255) not null,
  `type` varchar(255) not null,
  foreign key(`performer_id`) references `performers`(`id`) ON DELETE CASCADE,
  unique (`performer_id`, `url`),
  unique (`performer_id`, `type`)
);

CREATE TABLE `performer_piercings` (
  `performer_id` blob not null,
  `location` varchar(255),
  `description` varchar(255),
  foreign key(`performer_id`) references `performers`(`id`) ON DELETE CASCADE,
  unique (`performer_id`, `location`)
);

CREATE TABLE `performer_tattoos` (
  `performer_id` blob not null,
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

CREATE TABLE `tags` (
  `id` blob not null primary key,
  `name` varchar(255) not null,
  `description` varchar(255),
  `created_at` datetime not null,
  `updated_at` datetime not null,
  unique (`name`)
);

CREATE TABLE `tag_aliases` (
  `tag_id` blob not null,
  `alias` varchar(255) not null,
  foreign key(`tag_id`) references `tags`(`id`) ON DELETE CASCADE,
  unique (`alias`)
);

CREATE TABLE `studios` (
  `id` blob not null primary key,
  `name` varchar(255) not null,
  `parent_studio_id` blob,
  `created_at` datetime not null,
  `updated_at` datetime not null,
  foreign key(`parent_studio_id`) references `studios`(`id`) ON DELETE CASCADE
);

CREATE TABLE `studio_urls` (
  `studio_id` blob not null,
  `url` varchar(255) not null,
  `type` varchar(255) not null,
  foreign key(`studio_id`) references `studios`(`id`) ON DELETE CASCADE,
  unique (`studio_id`, `url`),
  unique (`studio_id`, `type`)
);

CREATE TABLE `scenes` (
  `id` blob not null primary key,
  `title` varchar(255),
  `details` varchar(255),
  `date` date,
  `studio_id` blob,
  `created_at` datetime not null,
  `updated_at` datetime not null,
  foreign key(`studio_id`) references `studios`(`id`) ON DELETE SET NULL
);

CREATE TABLE `scene_urls` (
  `scene_id` blob not null,
  `url` varchar(255) not null,
  `type` varchar(255) not null,
  foreign key(`scene_id`) references `scenes`(`id`) ON DELETE CASCADE,
  unique (`scene_id`, `url`),
  unique (`scene_id`, `type`)
);

CREATE TABLE `scene_fingerprints` (
  `scene_id` blob not null,
  `hash` varchar(255) not null,
  `algorithm` varchar(20) not null,
  foreign key(`scene_id`) references `scenes`(`id`) ON DELETE CASCADE,
  unique (`scene_id`, `algorithm`, `hash`)
);

CREATE INDEX `index_scene_fingerprints_on_hash` on `scene_fingerprints` (`algorithm`, `hash`);

CREATE TABLE `scene_performers` (
  `scene_id` blob not null,
  `as` varchar(255),
  `performer_id` blob not null,
  foreign key(`scene_id`) references `scenes`(`id`) ON DELETE CASCADE,
  foreign key(`performer_id`) references `performers`(`id`) ON DELETE CASCADE,
  unique(`scene_id`, `performer_id`)
);

CREATE TABLE `scene_tags` (
  `scene_id` blob not null,
  `tag_id` blob not null,
  foreign key(`scene_id`) references `scenes`(`id`) ON DELETE CASCADE,
  foreign key(`tag_id`) references `tags`(`id`) ON DELETE CASCADE,
  unique(`scene_id`, `tag_id`)
);

CREATE TABLE `users` (
  `id` blob not null primary key,
  `name` varchar(255) not null,
  `password_hash` varchar(60) not null,
  `email` varchar(255) not null,
  `api_key` varchar(255) not null,
  `api_calls` integer default 0,
  `last_api_call` datetime not null,
  `created_at` datetime not null,
  `updated_at` datetime not null,
  unique (`name`),
  unique (`email`)
);

CREATE TABLE `user_roles` (
  `user_id` blob not null,
  `role` varchar(10) not null,
  foreign key(`user_id`) references `users`(`id`) ON DELETE CASCADE,
  unique (`user_id`, `role`)
);

CREATE INDEX `index_users_on_name` on `users` (`name`);
CREATE INDEX `index_users_on_email` on `users` (`email`);
CREATE INDEX `index_users_on_api_key` on `users` (`api_key`);
