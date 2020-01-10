const CloseableDialog = require('./CloseableDialog');
const BuildableWithCount = require('./BuildableWithCount');
const i18n = require('LanguageData')

cc.Class({
  extends: CloseableDialog,
  properties: {
    buildableList: {
      type: cc.Node,
      default: null,
    },
    buildableWithCountPrefab: {
      type: cc.Prefab,
      default: null,
    },
    confirmButton: {
      type: cc.Button,
      default: null,
    },
    noteLabel: {
      type: cc.Label,
      default: null,
    },
    titleLabel: {
      type: cc.Label,
      default: null,
    },
  },

  init(mapIns, statefulBuildableInstance, isStatelessBuildableInstance) {
    const self = this;
    self.mapIns = mapIns;
    self.statefulBuildableInstance = statefulBuildableInstance;
    self.isStatelessBuildableInstance = isStatelessBuildableInstance;
  },

  render(level, [...buildableList]) {
    const self = this;
    self.titleLabel.string = i18n.t('UpgradeDependencyPanel.title');
    self.buildableList.removeAllChildren();
    buildableList.forEach(function({
      appearance, count, level,
    }) {
      if(count > 0){
        let node = cc.instantiate(self.buildableWithCountPrefab);
        let cpn = node.getComponent('BuildableWithCount');
        safelyAddChild(self.buildableList, node);
        // node.width = node.height = constants.SIZE.BUILDABLE_WITH_COUNT; 
        cpn.render(appearance, count, level);
      }
    });
    // TODO: Use `let formattedInstructionStr = cc.js.formatStr(i18n.t("UpgradeDependencyDialog.instruction"), statefulBuildable.displayName, (statefulBuildable.currentLevel + 1))` to get the actual formattedInstructionStr. 
    self.noteLabel.string = cc.js.formatStr(
      i18n.t("UpgradeDependencyPanel.Note.instruction"),
      i18n.t("BuildingInfo.DisplayName." + self.statefulBuildableInstance.displayName),
      level
    );
  },
  
  refreshNote(isMaxLevel) {
    const self = this;
    if (!self.isStatelessBuildableInstance) {
      return;
    }
    self.titleLabel.string = i18n.t("UpgradeDependencyPanel.titleForReachMaxCount");
    if (isMaxLevel) {
      self.noteLabel.string = cc.js.formatStr(
        i18n.t("UpgradeDependencyPanel.Note.reachMaxLevel"), 
        i18n.t("BuildingInfo.DisplayName." + self.statefulBuildableInstance.displayName)
      );
    } else {
      self.noteLabel.string = cc.js.formatStr(
        i18n.t("UpgradeDependencyPanel.Note.unlockMoreBuildable"), 
        i18n.t("BuildingInfo.DisplayName." + self.statefulBuildableInstance.displayName)
      )
    }
  }

});
