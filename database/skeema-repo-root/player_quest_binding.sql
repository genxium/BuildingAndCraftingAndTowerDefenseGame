CREATE TABLE `player_quest_binding` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `player_id` int(10) unsigned NOT NULL,
  `quest_id` int(10) unsigned NOT NULL,
  `completed_count` int(11) unsigned NOT NULL DEFAULT '0',
  `content` varchar(256) NOT NULL COMMENT 'Copied from table "quest" for convenient query.',
  `mission_id` int(10) unsigned NOT NULL COMMENT 'Copied from table "quest" for convenient query.',
  `resource_type` int(11) unsigned NOT NULL DEFAULT '0' COMMENT 'Copied from table "quest" for convenient query.',
  `resource_target_id` int(11) unsigned DEFAULT NULL COMMENT 'Copied from table "quest" for convenient query.',
  `resource_target_quantity` int(11) unsigned NOT NULL DEFAULT '0' COMMENT 'Copied from table "quest" for convenient query.',
  `completed_count_required` int(11) unsigned NOT NULL COMMENT 'Copied from table "quest" for convenient query.',
  `created_at` bigint(20) unsigned NOT NULL,
  `updated_at` bigint(20) unsigned NOT NULL,
  `deleted_at` bigint(20) unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_player_id_quest_id` (`player_id`,`quest_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;