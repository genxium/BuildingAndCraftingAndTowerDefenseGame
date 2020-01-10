CREATE TABLE `recipe` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `target_ingredient_id` int(11) unsigned DEFAULT NULL,
  `target_ingredient_count` int(10) unsigned DEFAULT '1',
  `duration_millis` int(10) unsigned DEFAULT '0',
  `to_unlock_simultaneously_recipe_id_list` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
