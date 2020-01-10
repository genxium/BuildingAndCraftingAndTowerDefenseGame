CREATE TABLE `mission_reward_binding` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `mission_id` int(10) unsigned NOT NULL DEFAULT '0',
  `add_resource_type` int(10) unsigned NOT NULL,
  `add_value` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mission_id_add_resource_type` (`mission_id`,`add_resource_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;