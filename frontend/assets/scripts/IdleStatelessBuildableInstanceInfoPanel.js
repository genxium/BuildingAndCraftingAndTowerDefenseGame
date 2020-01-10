const i18n = require('LanguageData');
const CloseableDialog = require('./CloseableDialog');
module.export = cc.Class({
  extends: CloseableDialog,
  properties: {
    activeAppearanceSprite: {
      type: cc.Sprite,
      default: null,
    },
    displayNameLabel: {
      type: cc.Label,
      default: null,
    },
    infomationLabel: {
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
    baseGoldProductionRateLabel: {
      type: cc.Label,
      default: null,
    },
    requiredBuildableContainerNode: {
      type: cc.Node,
      default: null,
    },
    requiredBuildableLabel: {
      type: cc.Label,
      default: null,
    },
    seatingCapacityLabel: cc.Label,
    seatingCapacityContainer: cc.Node,
    residentLimitLabel: cc.Label,
    residentLimitContainer: cc.Node,
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
  },

  init(mapIns) {
    this.mapIns = mapIns;
  },

  setData(statelessBuildableInstance, level) {
    const self = this;
    self.statelessBuildableInstance = statelessBuildableInstance;
    self.level = level;
    self.levelConf = statelessBuildableInstance.levelConfs.find(function(levelConf) {
      return levelConf.level == level;
    });
    self.requiredHeadquarterLevel = 0;
    for (let i = 0, len = self.levelConf.dependency.length; i < len; i++) {
      let theDependency = self.levelConf.dependency[i];
      if (theDependency.requiredBuildableId == constants.STATELESS_BUILDABLE_ID.HEADQUARTER) {
        self.requiredHeadquarterLevel = theDependency.requiredMinimumLevel;
        break;
      }
    }
  },

  refresh() {
    const self = this;
    const statelessBuildableInstance = self.statelessBuildableInstance;
    const levelConf = self.levelConf;
    const currentLevel = self.level;
    self.displayNameLabel.string = cc.js.formatStr(
      i18n.t("BuildingInfo.Short"),
      i18n.t("BuildingInfo.DisplayName." + statelessBuildableInstance.displayName),
      currentLevel
    );
    self.activeAppearanceSprite.spriteFrame = statelessBuildableInstance.appearance[currentLevel];
    self.infomationLabel.string = i18n.t('IdleStatefulBuildableInstanceInfoPanel.Info.' + statelessBuildableInstance.displayName);
    self.requiredTimeLabel.string = window.secondsToNaturalExp(levelConf.buildingOrUpgradingDuration, true);
    self.requiredGoldLabel.string = levelConf.buildingOrUpgradingRequiredGold;
    self.baseGoldProductionRateLabel.string = cc.js.formatStr(i18n.t("IdleStatelessBuildableInstanceInfoPanel.Tip.goldPerMinute"), levelConf.baseGoldProductionRate * 60);
    if (self.requiredHeadquarterLevel == 0) {
      self.requiredBuildableContainerNode.active = false;
    } else {
      self.requiredBuildableContainerNode.active = true;
      self.requiredBuildableLabel.string = cc.js.formatStr(
        i18n.t('IdleStatelessBuildableInstanceInfoPanel.Tip.requiredBuildable'),
        self.requiredHeadquarterLevel
      );
    }
    if (levelConf.baseFoodProductionRate > 0) {
      self.residentLimitContainer.active = true;
      self.residentLimitLabel.string = levelConf.baseFoodProductionRate;
    } else {
      self.residentLimitContainer.active = false;
    }
    let chairCount = constants.CHAIR_OFFSET_DATA.filter(function(chairData) {
      return chairData.buildableId == statelessBuildableInstance.id && chairData.buildableLevel == levelConf.level;
    }).length;
    if (chairCount > 0) {
      self.seatingCapacityContainer.active = true;
      self.seatingCapacityLabel.string = chairCount;
    } else {
      self.seatingCapacityContainer.active = false;
    }
  },

});
