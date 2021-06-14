CREATE TABLE `persistent_captcha` (
  `authkey` varchar(128) NOT NULL,
  `value` varchar(32) NOT NULL,
  `created_at` bigint(20) unsigned NOT NULL,
  `expires_at` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`authkey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
