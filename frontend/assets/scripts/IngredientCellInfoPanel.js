const CloseableDialog = require('./CloseableDialog');
const Ingredient = require('./Ingredient');
const i18nExtend = require('./modules/i18n-extends');
const i18nIngredientCompiler = new i18nExtend("Ingredient");
const i18n = require('LanguageData');

cc.Class({
  extends: CloseableDialog,
  properties: {
    descriptionLabel: cc.Label,
    ingredientInfo: Ingredient,
    priceContainerNode: cc.Node,
    reclaimContainerNode: cc.Node,
    acquiredAtContainer: cc.Node,
    acquiredAtList: cc.Node,
    buildableWithCountPrefab: cc.Prefab,
    soldierInfoContainer: cc.Node,
    soldierHpLabel: cc.Label,
    soldierDamageLabel: cc.Label,
    soldierSpeedLabel: cc.Label,
    soldierAttackFpsLabel: cc.Label,
    soldierDefendRadiusLabel: cc.Label,
    soldierResidenceOccupationLabel: cc.Label,
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
    self.ingredientInfo.init(mapIns);
  },

  setData(ingredient, buildableList) {
    const self = this;
    self.data = ingredient;
    self.acquiredAtBuildableData = buildableList;
    self.ingredientInfo.setData(ingredient);
  },

  refresh() {
    const self = this, ingredient = self.data, recipe = self.recipe;
    self.ingredientInfo.refresh();

    const toDisplayPriceValue = (null == ingredient.priceValue ? 0 : ingredient.priceValue); 
    self.ingredientInfo.priceValueLabel.string = i18nIngredientCompiler.render("Tip.Price.gold", toDisplayPriceValue);

    const toDisplayReclaimPriceValue = (null == ingredient.reclaimPriceValue ? 0 : ingredient.reclaimPriceValue); 
    self.ingredientInfo.reclaimPriceValueLabel.string = i18nIngredientCompiler.render("Tip.Price.gold", toDisplayReclaimPriceValue);

    if (self.mapIns.isIngredientProducible(ingredient)) {
      // This is an producible ingredient.
      self.priceContainerNode.active = true;
    } else {
      // This is an synthesizable ingredient. 
      self.priceContainerNode.active = ingredient.category == constants.INGREDIENT.CATEGORY.SOLDIER ? true : false;
    }

    self.descriptionLabel.string = i18nIngredientCompiler.render("Description." + ingredient.name);
    // render the acquiredAtBuildables [begin].
    if (self.acquiredAtBuildableData.length) {
      self.acquiredAtContainer.active = true;
      self.acquiredAtList.removeAllChildren();
      self.acquiredAtBuildableData.forEach(function({
        appearance, count, level,
      }) {
        let buildableWithCountNode = cc.instantiate(self.buildableWithCountPrefab);
        buildableWithCountNode.getComponent('BuildableWithCount').render(appearance, count, level);
        safelyAddChild(self.acquiredAtList, buildableWithCountNode);
      });
    } else {
      self.acquiredAtContainer.active = false;
    }

    // render soldier info.
    if (ingredient.category == constants.INGREDIENT.CATEGORY.SOLDIER) {
      self.soldierInfoContainer.active = true;
      let key = constants.NPC_ANIM.NAME[ingredient.name];
      self.soldierHpLabel.string = cc.js.formatStr(i18n.t("IngredientCellInfoPanel.Soldier.baseHp"), constants.NPC_BASE_HP[key]);
      self.soldierDamageLabel.string = cc.js.formatStr(i18n.t("IngredientCellInfoPanel.Soldier.baseDamage"), constants.NPC_BASE_DAMAGE[key]);
      self.soldierSpeedLabel.string = cc.js.formatStr(i18n.t("IngredientCellInfoPanel.Soldier.baseSpeed"), constants.NPC_BASE_SPEED[key]);
      self.soldierAttackFpsLabel.string = cc.js.formatStr(i18n.t("IngredientCellInfoPanel.Soldier.baseAttackFps"), constants.NPC_BASE_ATTACK_FPS[key]);
      self.soldierDefendRadiusLabel.string = cc.js.formatStr(i18n.t("IngredientCellInfoPanel.Soldier.baseDefenderRadius"), constants.NPC_BASE_DEFENDER_RADIUS[key]);
      self.soldierResidenceOccupationLabel.string = cc.js.formatStr(i18n.t("IngredientCellInfoPanel.Soldier.residenceOccupation"), ingredient.residenceOccupation);
    } else {
      self.soldierInfoContainer.active = false;
    }
    // render the acquiredAtBuildables [end].
  },


})
