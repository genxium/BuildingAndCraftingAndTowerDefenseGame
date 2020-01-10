CREATE TABLE `player_bulk_sync_data` (
  `player_id` int(10) unsigned NOT NULL,
  `pb_encoded_sync_data` mediumtext,
  `created_at` bigint(20) unsigned NOT NULL,
  `updated_at` bigint(20) unsigned NOT NULL,
  `deleted_at` bigint(20) unsigned DEFAULT NULL,
  UNIQUE KEY `uk_player_bulk_sync_data` (`player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
