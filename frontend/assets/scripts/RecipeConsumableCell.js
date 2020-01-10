const IngredientCell = require('./IngredientCell');
cc.Class({
  extends: IngredientCell,
  properties: {
    requiredCoundLabel: cc.Label,
  },
  setData(consumableData) {
    const self = this;
    self.consumableData = consumableData;
    let knapsackItem = self.mapIns.findKnapsackItemForIngredient(consumableData.ingredientId);
    if (null == knapsackItem) {
      knapsackItem = {
        id: -1,
        currentCount: 0,
        ingredient: self.mapIns.getIngredientById(consumableData.ingredientId),
      }
    }
    IngredientCell.prototype.setData.call(self, knapsackItem); 
  },
  refresh() {
    const self = this;
    IngredientCell.prototype.refresh.call(self);
    self.requiredCoundLabel.string = self.consumableData.count;
  },
  toDisabledView() {
    const self = this;
    IngredientCell.prototype.toDisabledView.apply(self, arguments);
    self.countLabel.node.active = true;
  },
});
