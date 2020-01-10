const i18n = require('LanguageData');
module.export = cc.Class({
  extends: cc.Component,

  properties: {
    clickableArea: {
      type: cc.Button,
      default: null,
    },
    activeAppearanceSprite: {
      type: cc.Sprite,
      default: null,
    },
    displayNameLabel: {
      type: cc.Label,
      default: null,
    },
    countLabel:{
      type: cc.Label,
      default: null,
    },
    requiredTimeLabel: {
      type: cc.Label,
      default: null,
    },
    requiredGoldLabel: {
      type: cc.Label,
      default: null,
    },
    infoPanelButton: {
      type: cc.Button,
      default: null,
    },
    maxCountLabel: {
      type: cc.Label,
      default: null,
    },
  },

  init(mapIns, statelessBuildableInstanceCardListScriptIns, fromStatelessBuildableInstance) {
    const defaultLv = 1;
    const self = this;
    self.mapIns = mapIns;
    self.statelessBuildableInstanceCardListScriptIns = statelessBuildableInstanceCardListScriptIns;
    self.displayNameLabel.string = i18n.t("BuildingInfo.DisplayName." + fromStatelessBuildableInstance.displayName);
    self.activeAppearanceSprite.spriteFrame = fromStatelessBuildableInstance.appearance[defaultLv];
    self.singleStatelessBuildableInstance = fromStatelessBuildableInstance;
    self.targetLevelConf = self.singleStatelessBuildableInstance.levelConfs.find(x => x.level == 1);
    // Initialization of required buildable dependency [begins].
      const currentCount = self.mapIns.countTargetStatefulBuildableInstance(self.singleStatelessBuildableInstance.id);
      self.countLabel.string = currentCount;
      self.requiredTimeLabel.string = window.secondsToNaturalExp(fromStatelessBuildableInstance.buildingOrUpgradingDuration[defaultLv], false);
      self.requiredGoldLabel.string = self.targetLevelConf.buildingOrUpgradingRequiredGold;
    // Initialization of required buildable dependency [ends].

    // Initialization of required building list [begins].
    const toRet = self.mapIns.determineCurrentlyLimitedCountAndLevel(self.singleStatelessBuildableInstance.id);
    self.maxCountLabel.string = toRet.currentlyLimitedCountToBuild;
    // Initialization of required building list [ends].

    if (!self.singleStatelessBuildableInstance.isBuildable()) {
      self.isBuildable = false;
      self.setAllSpriteState(cc.Sprite.State.GRAY);
    } else {
      self.isBuildable = true;
      self.setAllSpriteState(cc.Sprite.State.NORMAL);
    }

    self.toRet = toRet;
  },

  update() {
    const self = this;
  },

  onCardClicked(evt) {
    const self = this;
    const levelAtBuildDone = window.INITIAL_STATEFUL_BUILDABLE_LEVEL + 1;
    if (!self.isBuildable) {
      if (!self.singleStatelessBuildableInstance.isLevelDependencyMatchedInMapIns(levelAtBuildDone)) {
        self.mapIns.showUpgradeDependencyPanel(self.singleStatelessBuildableInstance, true);
      } else {
        self.mapIns.showUnlockMoreBuildablePanel(self);
      }
      cc.warn(`the statelessBuildableInstance is not buildable:`, self.singleStatelessBuildableInstance.displayName);
      return;
    }
    self.mapIns.tryToBuildStatefulBuildableInstance(self.singleStatelessBuildableInstance);
 },

 setAllSpriteState(state, interactable) {
   const SpriteMaterial = cc.Material.getBuiltinMaterial('2d-sprite');
   const GraySpriteMaterial = cc.Material.getBuiltinMaterial('2d-gray-sprite');
   function rSet(node) {
     let sprite = node.getComponent(cc.Sprite);
     if (sprite) {
        switch (state) {
        case cc.Sprite.State.GRAY:
          sprite.setMaterial(0, GraySpriteMaterial);
        break;
        default:
          sprite.setMaterial(0, SpriteMaterial);
        break;
        }
     }
     for (let childNode of node.children) {
       rSet(childNode);
     }
   }
   rSet(this.node);
 },

});
