CREATE TABLE `player_login` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `int_auth_token` varchar(64) NOT NULL,
  `player_id` int(11) unsigned NOT NULL,
  `display_name` varchar(32) DEFAULT NULL,
  `from_public_ip` varchar(32) DEFAULT NULL,
  `created_at` bigint(20) unsigned NOT NULL,
  `updated_at` bigint(20) unsigned NOT NULL,
  `deleted_at` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=834 DEFAULT CHARSET=utf8mb4;
