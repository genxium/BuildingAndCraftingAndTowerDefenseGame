CREATE TABLE `buildable_level_dependency` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `target_buildable_id` int(11) unsigned NOT NULL,
  `target_buildable_level` int(11) unsigned NOT NULL,
  `target_buildable_max_count` int(11) unsigned NOT NULL,
  `required_buildable_id` int(11) unsigned NOT NULL,
  `required_buildable_count` int(11) unsigned NOT NULL,
  `required_minimum_level` int(11) unsigned NOT NULL,
  UNIQUE KEY `uk_buildable_level_dependency` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;