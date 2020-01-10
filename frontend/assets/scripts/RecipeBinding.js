const IngredientCell = require('./IngredientCell');
cc.Class({
  extends: cc.Component,
  properties: {
    counsumableCellPrefab: {
      type: cc.Prefab,
      default: null,
      tooltip: 'This prefab will be instantiate according to the consumables of recipe', 
    },
    consumableListNode: cc.Node,
    targetIngredientPageCell: IngredientCell,
    durationMillisLabel: cc.Label,
    goldTipLabel: cc.Label,
    goldTipContainer: cc.Node,
  },
  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
    self.targetIngredientPageCell.init(mapIns);
  },
  setData(playerRecipe, specifiedBuildableId) {
    const self = this;
    self.recipe = playerRecipe;
    self.recipeData = playerRecipe.recipe;
    self.buildableId = specifiedBuildableId;
    if (null != self.recipeData) {
      self.targetIngredientPageCell.setData({ id: -1, currentCount: self.recipeData.targetIngredientCount, ingredient: playerRecipe.targetIngredient }, null, playerRecipe);
    } else {
      self.targetIngredientPageCell.setData({ id: -1, currentCount: 1, ingredient: playerRecipe.targetIngredient }, null, playerRecipe);
    }
  },
  refresh() {
    const self = this, recipeData = self.recipeData, recipe = self.recipe;
    // refresh targetIngredientPageCell
    self.targetIngredientPageCell.refresh();
    if (recipeData == null) {
      // this is a player_recipe record for producible ingredient.
      self.toProducibleRecipView();
      return;
    }
    // refresh consumableListNode
    self.consumableListNode.removeAllChildren();
    recipeData.consumables.forEach(function(consumableData) {
      let consumableCellNode = cc.instantiate(self.counsumableCellPrefab),
          consumableCellIns = consumableCellNode.getComponent('RecipeConsumableCell');
      consumableCellIns.init(self.mapIns);
      consumableCellIns.setData(consumableData);
      consumableCellIns.refresh();
      self.consumableListNode.addChild(consumableCellNode);
    });
    
    // refresh durationMillisLabel
    self.durationMillisLabel.string = window.secondsToNaturalExp(recipeData.durationMillis / 1000);

    switch (self.buildableId) {
      case constants.STATELESS_BUILDABLE_ID.LABORATORY:
        self.goldTipLabel.string = constants.PRICE.SYNTHESIZE;
        self.goldTipContainer.active = true;
        break;
      default:
        self.goldTipContainer.active = false;
        break;
    }
  },

  toProducibleRecipView() {
    const self = this;
  },

  onEnable() {
    const self = this;
    IngredientCell.prototype.onEnable && IngredientCell.prototype.onEnable.call(self);
    self.getComponentsInChildren(cc.Layout).reverse().forEach(function(layout) {
      layout.updateLayout();
    })
  },

});
