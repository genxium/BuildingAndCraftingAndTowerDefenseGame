CREATE TABLE `player_stage_binding` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int(11) unsigned NOT NULL,
  `stage_id` int(11) unsigned NOT NULL,
  `state` int(10) unsigned DEFAULT '0' COMMENT '1: UNLOCKED_BY_STARS, 2: UNLOCKED_BY_DIAMONDS, 3: UNLOCKED_BY_COMPLETING_PREV_STAGE',
  `highest_score` int(10) unsigned DEFAULT '0',
  `highest_stars` int(10) unsigned DEFAULT '0',
  `created_at` bigint(20) unsigned NOT NULL,
  `updated_at` bigint(20) unsigned NOT NULL,
  `pb_encoded_sync_data` mediumtext NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_player_stage_binding` (`player_id`,`stage_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
