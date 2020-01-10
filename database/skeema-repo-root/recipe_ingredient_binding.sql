CREATE TABLE `recipe_ingredient_binding` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `recipe_id` int(10) unsigned NOT NULL,
  `ingredient_id` int(10) unsigned NOT NULL,
  `count` int(10) unsigned NOT NULL,
  `prepended_binocular_operator` varchar(8) DEFAULT NULL COMMENT 'Such as "*", "+" etc., where a NULL value indicates the start of recipe.',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
