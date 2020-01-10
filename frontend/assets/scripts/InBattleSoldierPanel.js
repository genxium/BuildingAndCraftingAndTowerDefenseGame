const KnapsackPanel = require('./KnapsackPanel');
const FloatingKnapsackPanel = require('./FloatingKnapsackPanel');
const i18n = require('LanguageData');

cc.Class({
  extends: FloatingKnapsackPanel, 

  ctor() {
    this.activeSoldier = null;
    this.activeSoldierCell = null;
  },

  onLoad() {
    const self = this;
    KnapsackPanel.prototype.onLoad.apply(this, arguments);
    self.node.on(constants.EVENT.CELL_CLICK, self.selectActiveSoldierByClick, self);
  },

  refresh() {
    const self = this;
    KnapsackPanel.prototype.refresh.call(self, true);
    self.ingredientPageViewCtrl.refreshIndex();
    
    const soldierArray = self.data;
    if (0 == soldierArray.length) {
      const emptySoldierHint = i18n.t("InBattleSoldier.emptyHint");
      self.emptyHint.string = emptySoldierHint; 
    } else {
      self.emptyHint.string = ""; 
    }

    self.refreshRenderingActiveSoldier();

    self.refreshCellCoolDownDroppingDurationMillis();
  },

  searchForAndSwitchToPossibleActiveSoldier() {
    const self = this;
    let toBeActivePageIndex = 0; // Hardcoded temporarily. -- YFLu, 2019-10-30.
    let toBeActiveCellIndexInPage = null;

    const cellInsListInPage = self.getIngredientPageCellInsInCurrentPage();
    for (let k in cellInsListInPage) {
      const theCell = cellInsListInPage[k]; 
      if (theCell.data && 0 < theCell.data.currentCount) {
        self.activeSoldier = theCell.data;
        self.activeSoldierCell = theCell;
        self.selectActiveSoldierByIndexInCurrentPage(k);
        return;
      } else {
        continue;
      }
    }

    self.activeSoldier = null;
    self.activeSoldierCell = null;
    self.refresh();
  },

  selectActiveSoldierByIndexInCurrentPage(cellIndexInPage) {
    const self = this;
    const cellInsListInPage = self.getIngredientPageCellInsInCurrentPage();
    if (null == cellInsListInPage || cellIndexInPage >= cellInsListInPage.length) {
      console.warn("Error calling `selectActiveSoldierByIndexInCurrentPage` for ", cellIndexInPage);
      return;
    }
    self.activeSoldier = cellInsListInPage[cellIndexInPage].data;
    self.activeSoldierCell = cellInsListInPage[cellIndexInPage];
    // console.log("Of uuid == ", self.uuid, ", InBattleSoldierPanel.selectActiveSoldierByIndexInCurrentPage, activeSoldier == ", self.activeSoldier);
    self.refresh();
  },

  selectActiveSoldierByClick(evt) {
    const self = this;
    const {ingredientCell, relatedEvent} = evt.detail;
    if (0 >= ingredientCell.data.currentCount) {
      return;
    }
    self.activeSoldier = ingredientCell.data;
    self.activeSoldierCell = ingredientCell;
    // console.log("Of uuid == ", self.uuid, ", InBattleSoldierPanel.selectActiveSoldierByClick, activeSoldier == ", self.activeSoldier);
    self.refresh();
  },

  refreshRenderingActiveSoldier() {
    const self = this;
    const allCellListInAllPages = self.getAllIngredientPageCell();
    for (let k in allCellListInAllPages) {
      const theCell = allCellListInAllPages[k]; 
      if (theCell.data == self.activeSoldier) {
        theCell.selectedIndicatorNode.active = true;
      } else {
        theCell.selectedIndicatorNode.active = false;
      }  
    }
  },

  refreshCellCoolDownDroppingDurationMillis() {
    const self = this;
    const allCellListInAllPages = self.getAllIngredientPageCell();
    for (let k in allCellListInAllPages) {
      const theCell = allCellListInAllPages[k];
      const speciesName = constants.NPC_ANIM.NAME[theCell.ingredient.name];
      theCell.coolDownDurationMillis = constants.NPC_COOL_DOWN_DROPPING_DURATION_MILLIS[speciesName];
    }
  },
});
