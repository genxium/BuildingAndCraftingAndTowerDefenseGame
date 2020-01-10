const IngredientCell = require('./IngredientCell');
const StateBasedFactory = require('./modules/StateBasedFactory');

const PlayerIngredientCellState = cc.Enum({
  LOCKED: 0,
  UNLOCKED: 1,
});
const ClassOption = StateBasedFactory(PlayerIngredientCellState, PlayerIngredientCellState.LOCKED);
Object.assign(ClassOption.properties, {});
Object.assign(ClassOption, {
  extends: IngredientCell,
  setData(knapsackItem) {
    const self = this;
    IngredientCell.prototype.setData.apply(self, arguments);
    if (null != self.ingredient) {
      self.state = self.mapIns.isIngredientUnlocked(self.ingredient) ? PlayerIngredientCellState.UNLOCKED : PlayerIngredientCellState.LOCKED;
    }
  },
  refresh() {
    const self = this;
    IngredientCell.prototype.refresh.apply(self, arguments);
    self.refreshAppearanceState();
  },
  refreshAppearanceState() {
    const self = this;
    switch (self.state) {
    case PlayerIngredientCellState.LOCKED:
      // self.appearance.setState(cc.Sprite.State.GRAY);
      self.appearance.node.color = cc.color('#161616');
    break;
    case PlayerIngredientCellState.UNLOCKED:
      // self.appearance.setState(cc.Sprite.State.NORMAL);
      self.appearance.node.color = cc.Color.WHITE;
    break;
    default:
    break;
    }
  },
  onStateChanged(prev, current) {
    const self = this;
    self.refreshAppearanceState();
  },
})
cc.Class(ClassOption);

exports.STATE = PlayerIngredientCellState;

