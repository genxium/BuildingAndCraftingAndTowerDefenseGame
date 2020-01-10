CREATE TABLE `stage_initial_state` (
  `id` int(12) unsigned NOT NULL AUTO_INCREMENT,
  `stage_id` int(12) unsigned NOT NULL,
  `pb_b64_encoded_data` mediumtext NOT NULL,
  `pass_score` int(10) unsigned DEFAULT '0',
  `diamond_price` int(10) unsigned DEFAULT '0' COMMENT '0: could not buy stage with diamonds',
  `star_price` int(10) unsigned DEFAULT '0' COMMENT '0: could not buy stage with stars',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stage_initial_state` (`stage_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
