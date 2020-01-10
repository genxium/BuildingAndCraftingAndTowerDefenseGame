  CREATE TABLE `mailbox_transcript_en_us` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `version` int(3) unsigned NOT NULL DEFAULT '0',
  `transcript_key` varchar(255) NOT NULL,
  `payload_template` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
