CREATE TABLE `captcha` (
  `key` varchar(128) NOT NULL,
  `value` varchar(32) NOT NULL,
  `created_at` bigint(20) unsigned NOT NULL,
  `expires_at` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
