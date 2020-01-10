CREATE TABLE `buildable` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `type` int(4) unsigned NOT NULL,
  `discrete_width` int(11) unsigned NOT NULL,
  `discrete_height` int(11) unsigned NOT NULL,
  `display_name` varchar(32) NOT NULL,
  `auto_collect` int(3) unsigned DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
