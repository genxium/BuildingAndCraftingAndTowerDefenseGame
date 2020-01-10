const IngredientProgressCell = require('./IngredientProgressCell');

cc.Class({
  extends: IngredientProgressCell,

  properties: {
    consumableListNode: cc.Node,
    collectView: cc.Node,
  },

  init(mapIns) {
    const self = this;
    IngredientProgressCell.prototype.init.apply(self, arguments);
  },

  setData(ingredientProgress, consumableList) {
    const self = this;
    IngredientProgressCell.prototype.setData.apply(self, arguments);
    self.consumableList = consumableList;
  },

   refresh() {
    const self = this;
    IngredientProgressCell.prototype.refresh.apply(self, arguments);
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
    safelyAssignParent(self.appearance.node, self.collectView);
  },


})
