const IngredientProgressCell = require('./IngredientProgressCell');
const Ingredient = require('./Ingredient');
cc.Class({
  extends: IngredientProgressCell,

  properties: {
    ingredientInfo: Ingredient,
    collectView: cc.Node,
  },

  init(mapIns) {
    const self = this;
    IngredientProgressCell.prototype.init.apply(self, arguments);
    self.ingredientInfo.init(mapIns);
  },

  setData(ingredientProgress) {
    const self = this;
    IngredientProgressCell.prototype.setData.apply(self, arguments);
    self.ingredient = self.mapIns.findIngredientFromKnapsack(self.ingredientProgress.ingredientId);
    self.ingredientInfo.setData(self.ingredient);
  },

  refresh() {
    const self = this;
    IngredientProgressCell.prototype.refresh.apply(self, arguments);
    self.ingredientInfo.refresh();
    if (self.isPendingInQueue()) {
      self.elapsedTimeProgress.node.active = true;
      self.elapsedTimeProgress.progressBar.progress = 0;
      self.elapsedTimeProgress.indicatorLabel.string = "Waiting";
      self.elapsedTimeProgress.enabled = false;
    } else {
      self.elapsedTimeProgress.enabled = true;
    }
    self.collectButton.node.active = false;
    if (self.isCouldCollected()) {
      self.collectView.active = true;
      self.refreshCollectView();
    } else {
      self.collectView.active = false;
    }
  },

  refreshCollectView() {
    const self = this;
    if (self.ingredientInfo.node.parent != self.collectView) {
      let widget = self.ingredientInfo.getComponent(cc.Widget);
      widget.isAlignHorizontalCenter = true;
      widget.node.width = self.collectView.width;
      safelyAddChild(self.collectView, self.ingredientInfo.node);
      widget.updateAlignment();
    }
  },

});
