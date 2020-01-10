const IngredientPageCell = require('./IngredientPageCell.js');
const i18nExtend = require('./modules/i18n-extends');
cc.Class({
  extends: IngredientPageCell,
  properties: {
    lockedTip: cc.Node,
    requiredBuildableLevelLabel: cc.Label,
  },
  setData(knapsackItem, _sessionData, specificRecipe, requiredLevel) {
    const self = this;
    IngredientPageCell.prototype.setData.call(self, knapsackItem, _sessionData);
    if (null == knapsackItem) {
      self.recipe = null;
    } else {
      self.recipe = specificRecipe;
    }
    self.requiredLevel = requiredLevel || 1;
  },
  refresh() {
    const self = this;
    IngredientPageCell.prototype.refresh.apply(self, arguments);
    self.requiredBuildableLevelLabel.string = i18nExtend.render(
      'Tip.Recipe.requiredLevel', {level: self.requiredLevel}
    );
  },
  isEnabledState() {
    // TODO: false if the recipe of ingredient is LOCKED_DISPLAY_NAME_CONSUMABLES_UNKNOWN else true.
    const self = this;
    return self.node.active && self.data && self.recipe && self.recipe.state != constants.RECIPE.STATE.LOCKED_DISPLAY_NAME_CONSUMABLES_UNKNOWN;
  },
  toDisabledView() {
    const self = this;
    // TODO: handle 1 state: LOCKED_DISPLAY_NAME_CONSUMABLES_UNKNOWN.
    self.lockedTip.active = true;
  },

  toEnabledView() {
    const self = this, recipe = self.recipe;
    switch (recipe.state) {
    case constants.RECIPE.STATE.LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN:
      self.lockedTip.active = true;
      break;
    case constants.RECIPE.STATE.UNLOCKED:
      self.lockedTip.active = false;
      break;
    default:
    break;
    }
  },
})
