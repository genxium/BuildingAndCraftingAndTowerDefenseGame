const StateBasedFactory = require('./modules/StateBasedFactory');
const i18n = require('LanguageData');
const ArchiveBuildableCellState = cc.Enum({
  DEPENDENCY_MET_BUILT: 0,
  DEPENDENCY_MET_NOT_BUILT: 1,
  DEPENDENCY_NOT_MET: 2,
});
const ClassOption = StateBasedFactory(ArchiveBuildableCellState, ArchiveBuildableCellState.DEPENDENCY_NOT_MET);
Object.assign(ClassOption.properties, {
  appearance: cc.Sprite,
  levelLabel: cc.Label,

});
Object.assign(ClassOption, {
  extends: cc.Component,
  onLoad() {
    const self = this;
    // Initialization of clicked handler. [begin]
    let button = self.getComponent(cc.Button);
    let clickHandler = new cc.Component.EventHandler();
    clickHandler.target = self.node;
    clickHandler.component = self.node.name;
    clickHandler.handler = "onClicked";
    button.clickEvents = [
      clickHandler,
    ];
    // Initialization of clicked handler. [end]
  },
  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },
  setData(statelessBuildableInstance, buildableLevel) {
    const self = this;
    self.statelessBuildableInstance = statelessBuildableInstance;
    self.buildableLevel = buildableLevel;
  },
  refresh() {
    const self = this;
    let dependencyMet = self.statelessBuildableInstance.isLevelDependencyMatchedInMapIns(self.buildableLevel);
    let buildableList = self.mapIns.getStatefulBuildableInstanceListByBuildableId(self.statelessBuildableInstance.id);
    self.appearance.spriteFrame = self.statelessBuildableInstance.appearance[self.buildableLevel];
    self.levelLabel.string = cc.js.formatStr(i18n.t('BuildingInfo.Lv'), self.buildableLevel);
    if (!dependencyMet) {
      self.state = ArchiveBuildableCellState.DEPENDENCY_NOT_MET;
    } else {
      if (null != buildableList.find(function(statefulBuildableInstance) {
        return statefulBuildableInstance.currentLevel >= self.buildableLevel;
      })) {
        self.state = ArchiveBuildableCellState.DEPENDENCY_MET_BUILT;
      } else {
        self.state = ArchiveBuildableCellState.DEPENDENCY_MET_NOT_BUILT;
      }
    }
  },
  onClicked(evt) {
    const self = this;
    switch (self.state) {
    case ArchiveBuildableCellState.DEPENDENCY_MET_BUILT:
      self.onClickedWhenDependencyMet && self.onClickedWhenDependencyMet(true);
      break;
    case ArchiveBuildableCellState.DEPENDENCY_MET_NOT_BUILT:
      self.onClickedWhenDependencyMet && self.onClickedWhenDependencyMet(false);
      break;
    case ArchiveBuildableCellState.DEPENDENCY_NOT_MET:
      self.onClickedWhenDependencyNotMet && self.onClickedWhenDependencyNotMet();
      break;
    }
    self.mapIns.playEffectCommonButtonClick();
    self.onCellClicked && self.onCellClicked();
  },
})
cc.Class(ClassOption);

exports.STATE = ArchiveBuildableCellState;
