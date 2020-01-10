CREATE TABLE `buildable_level_binding` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `buildable_id` int(11) unsigned NOT NULL,
  `level` int(11) unsigned NOT NULL DEFAULT '1',
  `building_or_upgrading_duration` int(11) unsigned NOT NULL DEFAULT '0',
  `building_or_upgrading_required_gold` int(11) unsigned NOT NULL DEFAULT '0',
  `building_or_upgrading_required_residents_count` int(11) unsigned NOT NULL DEFAULT '1',
  `base_gold_production_rate` decimal(10,2) unsigned NOT NULL DEFAULT '0.00',
  `base_food_production_rate` int(11) unsigned NOT NULL DEFAULT '0',
  `base_rifleman_production_required_gold` int(11) unsigned NOT NULL DEFAULT '0',
  `base_rifleman_production_duration` int(11) unsigned NOT NULL DEFAULT '0',
  `gold_limit_addition` int(11) unsigned NOT NULL DEFAULT '0',
  `base_hp` int(10) unsigned NOT NULL DEFAULT '500',
  `base_damage` int(10) unsigned NOT NULL DEFAULT '40',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_buildable_id_level` (`buildable_id`,`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
