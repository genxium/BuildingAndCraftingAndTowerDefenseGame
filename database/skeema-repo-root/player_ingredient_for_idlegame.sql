CREATE TABLE `player_ingredient_for_idlegame` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int(11) unsigned NOT NULL,
  `ingredient_id` int(11) unsigned DEFAULT NULL COMMENT 'Of the target.',
  `state` int(10) unsigned DEFAULT '1',
  `created_at` bigint(20) unsigned NOT NULL,
  `updated_at` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_player_id_ingredient_id` (`player_id`,`ingredient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;