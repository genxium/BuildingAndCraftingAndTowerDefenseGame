CREATE TABLE `player_recipe` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int(11) unsigned NOT NULL,
  `recipe_id` int(11) unsigned DEFAULT NULL COMMENT 'If NULL, the current record indicates "producible in HQ".',
  `ingredient_id` int(11) unsigned DEFAULT NULL,
  `state` int(10) unsigned DEFAULT '0',
  `created_at` bigint(20) unsigned NOT NULL,
  `updated_at` bigint(20) unsigned NOT NULL,
  `to_unlock_simultaneously_recipe_id_list` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
