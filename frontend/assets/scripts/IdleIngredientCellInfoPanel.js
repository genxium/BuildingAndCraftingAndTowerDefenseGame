const CloseableDialog = require('./CloseableDialog');
const ArchiveIngredientCell = require('./ArchiveIngredientCell');
const i18n = require('LanguageData');

cc.Class({
  extends: CloseableDialog,
  properties: {
    descriptionLabel: cc.Label,
    archiveIngredientCell: {
      type: ArchiveIngredientCell,
      default: null,
    },
    acquiredAtTipLabel: cc.Label,
    okayButton: cc.Button,
    purchaseIngredientButton: cc.Button,
    congratulationNodes: [cc.Node],
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.apply(this, arguments);
    // Initialization of okayButton. [begin]
    const okayClickedHandler = new cc.Component.EventHandler();
    okayClickedHandler.target = this.node;
    okayClickedHandler.component = this.node.name;
    okayClickedHandler.handler = "onCloseClicked";
    this.okayButton.clickEvents = [
      okayClickedHandler,
    ];
    // Initialization of okayButton. [end]
    // Initialization of purchaseIngredientButton. [begin]
    const purchaseIngredientClickedHandler = new cc.Component.EventHandler();
    purchaseIngredientClickedHandler.target = this.node;
    purchaseIngredientClickedHandler.component = this.node.name;
    purchaseIngredientClickedHandler.handler = "onPurchaseIngredientButtonClicked";
    this.purchaseIngredientButton.clickEvents = [
      purchaseIngredientClickedHandler,
    ];
    // Initialization of purchaseIngredientButton. [end]
  },

  onDisable() {
    const self = this;
    CloseableDialog.prototype.onDisable && CloseableDialog.prototype.onDisable.apply(self, arguments);
    self.stopCongratulationAnimation();
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
    self.archiveIngredientCell.init(mapIns);
  },

  setData(ingredient, buildableList) {
    const self = this;
    self.data = ingredient;
    self.acquiredAtBuildableData = buildableList;
    self.archiveIngredientCell.setData(ingredient);
  },

  refresh() {
    const self = this, ingredient = self.data, recipe = self.recipe;
    self.archiveIngredientCell.refresh();
    self.descriptionLabel.string = i18n.t("IdleIngredientCellInfoPanel.Description." + ingredient.name);
    self.acquiredAtTipLabel.string = cc.js.formatStr(
      i18n.t("IdleIngredientCellInfoPanel.Tip.acquiredAt"),
      self.acquiredAtBuildableData.map(function(statelessBuildableInstance) {
        return i18n.t("BuildingInfo.DisplayName." + statelessBuildableInstance.displayName);
      }).join(',')
    );
  },

  onPurchaseIngredientButtonClicked(evt) {
    const self = this;
    const ingredient = self.data;
    self.mapIns.toUnlockeIngredientByPurchasing(ingredient.id);
  },

  playCongratulationAnimation() {
    const self = this;
    self.congratulationNodes.forEach(function(node) {
      if (null == node) {
        return;
      }
      node.active = true;
    });
  },

  stopCongratulationAnimation() {
    const self = this;
    self.congratulationNodes.forEach(function(node) {
      if (null == node) {
        return;
      }
      node.active = false;
    });
  },
})
