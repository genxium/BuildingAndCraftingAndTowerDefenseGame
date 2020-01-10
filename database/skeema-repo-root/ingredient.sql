CREATE TABLE `ingredient` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `price_currency` int(11) unsigned NOT NULL DEFAULT '1' COMMENT '1:gold, 2:diamond',
  `price_value` int(11) unsigned NOT NULL DEFAULT '0',
  `name` varchar(50) DEFAULT NULL,
  `base_production_duration_millis` int(10) unsigned NOT NULL DEFAULT '0',
  `reclaim_price_currency` int(11) unsigned NOT NULL DEFAULT '1' COMMENT '1:gold, 2:diamond',
  `reclaim_price_value` int(11) unsigned NOT NULL DEFAULT '0',
  `base_reclaim_duration_millis` int(11) unsigned NOT NULL DEFAULT '0',
  `category` int(11) unsigned NOT NULL DEFAULT '0',
  `residence_occupation` int(11) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
