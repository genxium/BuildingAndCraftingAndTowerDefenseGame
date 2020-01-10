const i18n = require('LanguageData');
cc.Class({
  extends: cc.Component,
  properties: {
    buildableCellPrefab: cc.Prefab,
    titleLabel: cc.Label,
    statelessBuildableListNode: cc.Node,
  },
  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },
  setData(statelessBuildableInstance) {
    const self = this;
    self.statelessBuildableInstance = statelessBuildableInstance;
    self.statelessBuildableListNode.removeAllChildren();
    for (let levelConf of statelessBuildableInstance.levelConfs) {
      let buildableNode = cc.instantiate(self.buildableCellPrefab);
      let buildableIns = buildableNode.getComponent('ArchiveBuildableCell');
      buildableIns.init(self.mapIns);
      buildableIns.setData(statelessBuildableInstance, levelConf.level);
      buildableIns.onCellClicked = self._onBuildableCellClicked;
      buildableIns.onClickedWhenDependencyMet = function() {
        self.mapIns.showStatelessBuildableInstanceInfoPanel(statelessBuildableInstance, levelConf.level);
      }
      buildableIns.onClickedWhenDependencyNotMet = function() {
        self.mapIns.showUpgradeDependencyPanel(self.statelessBuildableInstance, true, levelConf.level - 1);
      }
      self.statelessBuildableListNode.addChild(buildableNode);
    }
  },
  refresh() {
    const self = this;
    const statelessBuildableInstance = self.statelessBuildableInstance;
    self.titleLabel.string = i18n.t("BuildingInfo.DisplayName." + statelessBuildableInstance.displayName);
    for (let statelessBuildableNode of self.statelessBuildableListNode.children) {
      let statelessBuildableIns = statelessBuildableNode.getComponent('ArchiveBuildableCell');
      statelessBuildableIns.refresh();
    }
  },
  
})
