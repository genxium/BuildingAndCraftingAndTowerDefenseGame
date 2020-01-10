CREATE TABLE `ingredient_progress` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `owner_player_id` int(10) unsigned NOT NULL,
  `ingredient_id` int(10) unsigned DEFAULT NULL COMMENT 'When being NULL, the recipe_id of this record should not be null simultaneously and referring to a multi-target recipe.',
  `state` int(3) unsigned DEFAULT NULL,
  `player_buildable_binding_id` bigint(20) unsigned DEFAULT NULL COMMENT 'When not being NULL, this field refers to the local "player_buildable_binding.id" in corresponding "player_bulk_sync_data".',
  `recipe_id` int(10) unsigned DEFAULT NULL COMMENT 'When not being NULL, a cancelled record should recover its compositing ingredients into the knapsack of "owner_player_id".',
  `created_at` bigint(20) unsigned NOT NULL,
  `duration_millis` int(10) unsigned NOT NULL,
  `started_at` bigint(20) unsigned DEFAULT NULL,
  `millis_to_start` int(10) unsigned DEFAULT NULL,
  `updated_at` bigint(20) unsigned DEFAULT NULL,
  `target_ingredient_count` int(10) unsigned NOT NULL DEFAULT '1',
  `progress_type` int(3) unsigned NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `hash_owner_player_id_ingredient_id` (`owner_player_id`,`ingredient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
