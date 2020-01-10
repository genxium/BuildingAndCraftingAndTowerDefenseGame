CREATE TABLE `buildable_ingredient_interaction` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `buildable_id` int(11) unsigned NOT NULL,
  `ingredient_id` int(10) unsigned DEFAULT NULL,
  `recipe_id` int(10) unsigned DEFAULT NULL COMMENT 'Not null only when type is "SYNTHESIZABLE".',
  `type` int(3) unsigned NOT NULL DEFAULT '1' COMMENT '1: SYNTHESIZE_CONSUMABLE, 2: RECLAIM, 3: SYNTHESIZE_TARGET, 4: PRODUCIBLE, 5: SYNTHESIZABLE',
  `buildable_level_to_unlock_display_name` int(10) unsigned DEFAULT '0',
  `ingredient_purchase_price_currency` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '0: GOLD, 2: DIAMOND',
  `ingredient_purchase_price_value` int(10) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_buildable_ingredient_interaction` (`buildable_id`,`ingredient_id`,`recipe_id`,`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
