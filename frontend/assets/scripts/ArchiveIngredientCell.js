const IngredientCell = require('./IngredientCell');
const StateBasedFactory = require('./modules/StateBasedFactory');

const ArchiveIngredientCellState = cc.Enum({
  LOCKED_NAME_KNOWN: 0,
  UNLOCKED: 1,
  LOCKED_INGREDIENT_PURCHASABLE_TO_UNLOCK: 2,
});

const ClassOption = StateBasedFactory(ArchiveIngredientCellState, ArchiveIngredientCellState.LOCKED_NAME_KNOWN);

Object.assign(ClassOption.properties, {
  purchasePriceLabel: cc.Label,
});

Object.assign(ClassOption, {
  extends: IngredientCell,
  onEnable() {
    const self = this;
    IngredientCell.prototype.onEnable && IngredientCell.prototype.onEnable.call(self);
    self.node.on(constants.EVENT.CELL_CLICK, self._onCellClicked, self, true);
  },

  onDisable() {
    const self = this;
    IngredientCell.prototype.onDisable && IngredientCell.prototype.onDisable.call(self);
    self.node.off(constants.EVENT.CELL_CLICK, self._onCellClicked, self, true);
  },

  setData(ingredient) {
    const self = this;
    IngredientCell.prototype.setData.call(self, ingredient, {ingredient: true}); 
  },
  refresh() {
    const self = this;
    IngredientCell.prototype.refresh.apply(self, arguments);
    const ingredient = self.ingredient;
    let targetInteraction = null, ingredientPrice = 0;
    let relatedPlayerIngredientRecord = self.mapIns.getPlayerIngredientForIdleGameByIngredientId(ingredient.id);
    
    if (null == relatedPlayerIngredientRecord) {
      self.state = ArchiveIngredientCellState.LOCKED_NAME_KNOWN;
    } else {
      switch (relatedPlayerIngredientRecord.state) {
      case constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.LOCKED_INGREDIENT_PURCHASABLE_TO_UNLOCK:
        self.state = ArchiveIngredientCellState.LOCKED_INGREDIENT_PURCHASABLE_TO_UNLOCK;
        targetInteraction = self.mapIns.filterBuildableIngredientInteractionByIngredientId(ingredient.id)[0];
        ingredientPrice = targetInteraction.ingredientPurchasePriceValue;
        self.purchasePriceLabel.string = ingredientPrice;
        break;
      case constants.PLAYER_INGREDIENT_FOR_IDLEGAME.STATE.UNLOCKED:
        self.state = ArchiveIngredientCellState.UNLOCKED;
        break;
      default:
        self.state = ArchiveIngredientCellState.LOCKED_NAME_KNOWN;
        break;
      }
    }
  },
  _onCellClicked(evt) {
    const self = this;
    const {ingredientCell, relatedEvent} = evt.detail;
    switch(self.state) {
    case ArchiveIngredientCellState.UNLOCKED:
      self.onUnlockedCellClicked && self.onUnlockedCellClicked();
      break;
    case ArchiveIngredientCellState.LOCKED_NAME_KNOWN:
      self.onLockedCellClicked && self.onLockedCellClicked();
      break;
    case ArchiveIngredientCellState.LOCKED_INGREDIENT_PURCHASABLE_TO_UNLOCK:
      self.onPurchasing && self.onPurchasing();
      break;
    }
    self.onCellClicked && self.onCellClicked();
  },
})

module.exports = cc.Class(ClassOption);

exports.STATE = ArchiveIngredientCellState;

