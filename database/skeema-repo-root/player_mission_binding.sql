CREATE TABLE `player_mission_binding` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int(10) unsigned NOT NULL,
  `mission_id` int(10) unsigned NOT NULL,
  `batch_id` int(10) unsigned DEFAULT NULL,
  `depends_on_batch_id` int(10) unsigned DEFAULT '0',
  `description` varchar(256) NOT NULL,
  `complete_state` tinyint(4) NOT NULL DEFAULT '0',
  `reproductive` int(3) unsigned DEFAULT '0',
  `type` int(3) unsigned DEFAULT '0',
  `created_at` bigint(20) unsigned NOT NULL,
  `updated_at` bigint(20) unsigned NOT NULL,
  `deleted_at` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_player_id_mission_id` (`player_id`,`mission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;