CREATE TABLE `knapsack` (
  `id` int(12) unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int(11) unsigned NOT NULL,
  `ingredient_id` int(10) unsigned NOT NULL,
  `current_count` int(10) unsigned NOT NULL,
  `created_at` bigint(20) unsigned NOT NULL,
  `updated_at` bigint(20) unsigned NOT NULL,
  `deleted_at` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_knapsack` (`player_id`,`ingredient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
