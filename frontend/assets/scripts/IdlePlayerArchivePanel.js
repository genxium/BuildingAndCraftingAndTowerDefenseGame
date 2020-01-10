const CloseableDialog = require('./CloseableDialog');
const i18n = require('LanguageData');
// Warning: The TAB should consistent to the label showed under tabContainer.
const IdlePlayerArchiveTab = cc.Enum({
  BUILDABLE: 0,
  HOUSEKEEPER: 1,
  INGREDIENT: 2,
});
cc.Class({
  extends: CloseableDialog,
  properties: {
    tabContainer: cc.ToggleContainer,
    viewingTab: {
      type: IdlePlayerArchiveTab,
      default: IdlePlayerArchiveTab.BUILDABLE,
    },
    ingredientListContainer: cc.Node,
    buildableListContainer: cc.Node,
    ingredientListNode: cc.Node,
    buildableListNode: cc.Node,
    ingredientCellPrefab: cc.Prefab,
    statelessBuildableCellPrefab: cc.Prefab,
    tipLabelContainer: cc.Node,
    tipLabel: cc.Label,
    tipStayDurationMillis: 5000,

    housekeeperListContainer: cc.Node,
    housekeeperListNode: cc.Node,
    housekeeperCellPrefab: cc.Prefab,

  },
  onLoad () {
    const self = this;
    CloseableDialog.prototype.onLoad.apply(self, arguments);
    let toggleItemsIndex = self.viewingTab;
    self.tabContainer.toggleItems[toggleItemsIndex].isChecked = true;
    // Initialization of tab changed. [begin]
    let checkEventHandler = new cc.Component.EventHandler();
    checkEventHandler.target = self.node;
    checkEventHandler.component = 'IdlePlayerArchivePanel';
    checkEventHandler.handler = 'onTabChanged';
    self.tabContainer.checkEvents = [
      checkEventHandler,
    ];
    for (let toggleItem of self.tabContainer.toggleItems) {
      let clickHandler = new cc.Component.EventHandler();
      clickHandler.target = self.node;
      clickHandler.component = 'IdlePlayerArchivePanel';
      clickHandler.handler = 'onTabClicked';
      toggleItem.clickEvents = [
        clickHandler,
      ];
    }
    // Initialization of tab changed. [false]
  },

  toggleToBuildableTab() {
    const self = this;
    if (self.viewingTab == IdlePlayerArchiveTab.BUILDABLE) {
      return;
    }
    self.viewingTab = IdlePlayerArchiveTab.BUILDABLE;
    self.tabContainer.toggleItems[self.viewingTab].isChecked = true;
  },

  toggleToIngredientTab() {
    const self = this;
    if (self.viewingTab == IdlePlayerArchiveTab.INGREDIENT) {
      return;
    }
    self.viewingTab = IdlePlayerArchiveTab.INGREDIENT;
    self.tabContainer.toggleItems[self.viewingTab].isChecked = true;
  },

  toggleToHousekeeperTab() {
    const self = this;
    if (self.viewingTab == IdlePlayerArchiveTab.HOUSEKEEPER) {
      return;
    }
    self.viewingTab = IdlePlayerArchiveTab.HOUSEKEEPER;
    self.tabContainer.toggleItems[self.viewingTab].isChecked = true;
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },

  setData(ingredientList, statelessBuildableInstanceList, housekeeperBuildableIdList) {
    const self = this;
    self.ingredientList = ingredientList;
    self.statelessBuildableInstanceList = statelessBuildableInstanceList;
    self.housekeeperBuildableIdList = housekeeperBuildableIdList;
    // Initialization of ingredientListNode. [begin]
    self.ingredientListNode.removeAllChildren();
    for (let index in self.ingredientList) {
      const ingredient = self.ingredientList[index];
      let ingredientCellNode = cc.instantiate(self.ingredientCellPrefab);
      let ingredientCellIns = ingredientCellNode.getComponent('ArchiveIngredientCell');
      ingredientCellIns.init(self.mapIns);
      ingredientCellIns.setData(ingredient);
      ingredientCellIns.onLockedCellClicked = function() {
        let buildableAndLevel = self.mapIns.getBuildableAndLevelForUnlockingIngredient(ingredient.id);  
        self.showTip(
          cc.js.formatStr(
            i18n.t("IdlePlayerArchivePanel.Tip.unlockBuildableToLevel"),
            i18n.t("BuildingInfo.DisplayName." + buildableAndLevel.statelessBuildableInstance.displayName),
            buildableAndLevel.level
          )
        );
      };
      ingredientCellIns.onUnlockedCellClicked = function() {
        self.mapIns.showIngredientCellInfoPanel(ingredientCellIns);
      };
      ingredientCellIns.onPurchasing = function() {
        self.mapIns.showIngredientCellInfoPanel(ingredientCellIns);
      };
      
      self.ingredientListNode.addChild(ingredientCellNode);
    }
    // Initialization of ingredientListNode. [end]
    self.buildableListNode.removeAllChildren();
    // Initialization of buildableListNode. [begin]
    for (let index in self.statelessBuildableInstanceList) {
      let statelessBuildableInstance = self.statelessBuildableInstanceList[index];
      let statelessBuildableCellNode = cc.instantiate(self.statelessBuildableCellPrefab);
      let statelessBuildableCellIns = statelessBuildableCellNode.getComponent('ArchiveStatelessBuildableCell');
      statelessBuildableCellIns.init(self.mapIns);
      statelessBuildableCellIns.setData(statelessBuildableInstance);
      self.buildableListNode.addChild(statelessBuildableCellNode);
    }
    // Initialization of buildableListNode. [end]
    self.housekeeperListNode.removeAllChildren();
    // Initialization of housekeeperListNode. [begin] {
    for (let index in self.housekeeperBuildableIdList) {
      let buildableId = self.housekeeperBuildableIdList[index];
      let housekeeperBinding = self.mapIns.housekeeperBindingList.find(function(x) {
        return x.buildableId == buildableId;
      });
      let housekeeperCellNode = cc.instantiate(self.housekeeperCellPrefab);
      let housekeeperCellIns = housekeeperCellNode.getComponent('HousekeeperCell');
      housekeeperCellIns.init(self.mapIns);
      self.housekeeperListNode.addChild(housekeeperCellNode);
    }
    // Initialization of housekeeperListNode. [end] }

  },

  refresh() {
    const self = this;
    self.tipLabelContainer.opacity = 0;
    self.tipLabelContainer.stopAllActions();
    switch (self.viewingTab) {
    case IdlePlayerArchiveTab.INGREDIENT:
      self.ingredientListContainer.active = true;
      self.buildableListContainer.active = false;
      self.housekeeperListContainer.active = false;
      for (let index in self.ingredientListNode.children) {
        const ingredient = self.ingredientList[index];
        const ingredientCellNode = self.ingredientListNode.children[index];
        const ingredientCellIns = ingredientCellNode.getComponent('ArchiveIngredientCell');
        ingredientCellIns.setData(ingredient);
        ingredientCellIns.refresh();
      }
      break;
    case IdlePlayerArchiveTab.BUILDABLE:
      self.ingredientListContainer.active = false;
      self.buildableListContainer.active = true;
      self.housekeeperListContainer.active = false;
      for (let statelessBuildableCellNode of self.buildableListNode.children) {
        statelessBuildableCellNode.getComponent('ArchiveStatelessBuildableCell').refresh();
      }
      break;
    case IdlePlayerArchiveTab.HOUSEKEEPER:
      self.ingredientListContainer.active = false;
      self.buildableListContainer.active = false;
      self.housekeeperListContainer.active = true;
      for (let index = 0; index < self.housekeeperListNode.children.length; index++) {
        const housekeeperCellNode = self.housekeeperListNode.children[index];
        let buildableId = self.housekeeperBuildableIdList[index];
        let housekeeperBinding = self.mapIns.housekeeperBindingList.find(function(x) {
          return x.buildableId == buildableId;
        });
        const housekeeperCellIns = housekeeperCellNode.getComponent('HousekeeperCell');
        housekeeperCellIns.setData(buildableId, housekeeperBinding);
        housekeeperCellIns.refresh();
      }
      break;
    }
  },

  onTabChanged(toggle) {
    const self = this;
    self.viewingTab = self.tabContainer.toggleItems.indexOf(toggle);
    self.refresh();
  },

  onTabClicked(evt) {
    const self = this;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
  },

  showTip(tip="") {
    const self = this;
    self.tipLabelContainer.stopAllActions();
    self.tipLabelContainer.opacity = 255;
    self.tipLabel.string = tip;
    self.tipLabelContainer.runAction(
      cc.sequence(
        cc.delayTime(self.tipStayDurationMillis / 1000),
        cc.fadeOut(0.5)
      )
    );
  },

});

