const i18n = require('LanguageData');

cc.Class({
  extends: cc.Component,

  properties: {
    appearanceBox: cc.Node,
    appearance: cc.Sprite,
    completedCountIndicator: cc.Label,
    completedCountRequiredIndicator: cc.Label,
    targetQuantityIndicator: cc.Label,
    escapedAttackingNpcForEnemyIndicatorSf: cc.SpriteFrame,
    escapedAttackingNpcForAllyIndicatorSf: cc.SpriteFrame,
  },

  ctor() {
    this.mapIns = null;
    this.currentCompletedCount = 0;
    this.completedCountRequired = 0;
  },

  onLoad() {
  },

  setData(quest) {
    let targetStatelessBuildable = null;
    this.quest = quest;
    switch (quest.resourceType) {
    case constants.RESOURCE_TYPE.STATEFUL_BUILDABLE_LEVEL:
      this.targetQuantityIndicator.string = cc.js.formatStr(i18n.t("BuildingInfo.Lv"), quest.resourceTargetQuantity);
      this.currentCompletedCount = 0;
      this.completedCountRequired = quest.completedCountRequired;
      this.completedCountIndicator.string = 0; // Shall I initialize this by the current "this.mapIns.statefulBuildableInstanceCompList"? -- YFLu, 2019-09-14
      this.completedCountRequiredIndicator.string = quest.completedCountRequired;
      for (let single of this.mapIns.statelessBuildableInstanceList) {
        if (single.id != quest.resourceTargetId) {
          continue;
        }
        targetStatelessBuildable = single;
        break;
      }
      if (null == targetStatelessBuildable) {
        break;
      }
      this.appearance.spriteFrame = targetStatelessBuildable.appearance[quest.resourceTargetQuantity];
    break;
    case constants.RESOURCE_TYPE.TARGET_INGREDIENT:
      this.currentCompletedCount = 0;
      this.completedCountRequired = quest.completedCountRequired;
      this.completedCountIndicator.string = 0;
      this.completedCountRequiredIndicator.string = quest.completedCountRequired;

      const ingredientData = this.mapIns.ingredientMap[quest.resourceTargetId];
      this.appearance.spriteFrame = ingredientData.appearance;
    break;
    case constants.RESOURCE_TYPE.ESCAPED_ATTACKING_NPC_FOR_ENEMY:
      this.currentCompletedCount = 0;
      this.completedCountRequired = quest.completedCountRequired;
      this.completedCountIndicator.string = 0;
      this.completedCountRequiredIndicator.string = quest.completedCountRequired;
      this.appearanceBox.color = cc.Color.RED;
      this.appearance.spriteFrame = this.escapedAttackingNpcForEnemyIndicatorSf;
    break;
    case constants.RESOURCE_TYPE.ESCAPED_ATTACKING_NPC_FOR_ALLY:
      this.currentCompletedCount = 0;
      this.completedCountRequired = quest.completedCountRequired;
      this.completedCountIndicator.string = 0;
      this.completedCountRequiredIndicator.string = quest.completedCountRequired;
      this.appearanceBox.color = cc.Color.GREEN;
      this.appearance.spriteFrame = this.escapedAttackingNpcForAllyIndicatorSf;
    break;
    case constants.RESOURCE_TYPE.STATEFULBUILDABLE_DESTORYED:
      this.currentCompletedCount = 0;
      this.completedCountRequired = quest.completedCountRequired;
      this.completedCountIndicator.string = 0;
      this.completedCountRequiredIndicator.string = quest.completedCountRequired;
      this.appearance.color = cc.Color.ORANGE;
      for (let single of this.mapIns.statelessBuildableInstanceList) {
        if (single.id != quest.resourceTargetId) {
          continue;
        }
        targetStatelessBuildable = single;
        break;
      }
      if (null == targetStatelessBuildable) {
        break;
      }
      this.appearance.spriteFrame = targetStatelessBuildable.appearance[quest.resourceTargetQuantity];
    default:
    break; 
    }
  },

  updateCurrentCompletedCount(currentCompletedCount) {
    /*
    TODO: Please insert asymmetric animation for increment/decrement updates. -- YFLu, 2019-09-21
    */
    const self = this;
    const quest = self.quest;
    const prevCompletedCount = self.currentCompletedCount;
    self.currentCompletedCount = currentCompletedCount;
    self.completedCountIndicator.string = self.currentCompletedCount;
    if (prevCompletedCount < self.completedCountRequired && self.currentCompletedCount >= currentCompletedCount) {
      self.onCompleted && self.onCompleted();
    }
    return;
  },

});
