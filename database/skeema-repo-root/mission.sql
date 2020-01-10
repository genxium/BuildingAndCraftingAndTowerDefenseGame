CREATE TABLE `mission` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `description` varchar(256) NOT NULL,
  `batch_id` int(10) unsigned DEFAULT NULL,
  `depends_on_batch_id` int(10) unsigned DEFAULT '0',
  `reproductive` int(3) unsigned DEFAULT '0',
  `type` int(3) unsigned DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;