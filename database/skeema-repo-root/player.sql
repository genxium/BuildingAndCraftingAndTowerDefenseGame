CREATE TABLE `player` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `display_name` varchar(32) DEFAULT NULL,
  `created_at` bigint(20) unsigned NOT NULL,
  `updated_at` bigint(20) unsigned NOT NULL,
  `deleted_at` bigint(20) unsigned DEFAULT NULL,
  `unlocked_maps` varchar(32) DEFAULT '1',
  `star` int(10) unsigned DEFAULT '0',
  `diamond` int(10) unsigned DEFAULT '0',
  `last_successful_check_in_at` bigint(20) unsigned DEFAULT NULL,
  `interrupt_tutorial_mask` varchar(1024) DEFAULT '' COMMENT 'Encoded in b64 manner for 0/1 indicators.',
  `diamond_last_auto_fill_at` bigint(20) unsigned DEFAULT NULL,
  `diamond_auto_fill_upper_limit` int(10) unsigned DEFAULT '7',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=369 DEFAULT CHARSET=utf8mb4;
