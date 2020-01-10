CREATE TABLE `quest` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `mission_id` int(10) unsigned NOT NULL,
  `content` varchar(256) NOT NULL,
  `resource_type` int(11) unsigned NOT NULL DEFAULT '0',
  `resource_target_id` int(11) unsigned DEFAULT NULL,
  `resource_target_quantity` int(11) unsigned NOT NULL DEFAULT '0',
  `completed_count_required` int(11) unsigned NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;