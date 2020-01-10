const KnapsackPanel = require('./KnapsackPanel');
const StateBasedFactory = require('./modules/StateBasedFactory');
const PlayerIngredientCellState = require('./PlayerIngredientCell').STATE;

const PlayerIngredientPanelState = cc.Enum({
  IDLE: 0,
  LOCKED_INGREDIENT_CLICKED: 1,
  UNLOCKED_INGREDIENT_CLICKED: 2,
});
const ClassOption = StateBasedFactory(PlayerIngredientPanelState, PlayerIngredientPanelState.IDLE, 'panelClickedState');
Object.assign(ClassOption.properties, {
  cellDragable: {
    default: false,
    visible: false,
    override: true,
  },
  pageViewScrollEnabled: {
    default: true,
    override: true,
  },
  defaultClickHandler: {
    default: true,
    visible: false,
    override: true,
  },
  isPageCategoried: {
    visible: false,
    override: true,
    default: false,
  },
  useDefaultCellInfoHandler: {
    visible: false,
    override: true,
    default: false,
  },
  unlockIngredientTipLabel: cc.Label,
});
Object.assign(ClassOption, {
  extends: KnapsackPanel,
  setData(ingredientList) {
    const self = this;
    let fakeKnapsackArray = null != ingredientList ? ingredientList.map((ingredient) => {
      return {
        id: -1,
        currentCount: 1,
        ingredient,
      };
    }) : self._data;
    KnapsackPanel.prototype.setData.call(self, fakeKnapsackArray);
  },
  refresh() {
    const self = this;
    KnapsackPanel.prototype.refresh.apply(self, arguments);
    self.panelClickedState = PlayerIngredientPanelState.IDLE;
  },
  _defaultClickHandler(evt) {
    const self = this; 
    const {ingredientCell, relatedEvent} = evt.detail;
    if (ingredientCell.state == PlayerIngredientCellState.UNLOCKED) {
      self.mapIns.onIngredientPageCellClicked && self.mapIns.onIngredientPageCellClicked(self, ingredientCell);
      self.panelClickedState = PlayerIngredientPanelState.UNLOCKED_INGREDIENT_CLICKED;
    } else {
      let buildableAndLevel = self.mapIns.getBuildableAndLevelForUnlockingIngredient(ingredientCell.ingredient.id);
      self.unlockIngredientTipLabel.string = i18nExtend.render('PlayerIngredientPanel.Tip.unlockBuildableToLevel', {
        displayName: i18nExtend.render('BuildingInfo.DisplayName.' + buildableAndLevel.statelessBuildableInstance.displayName),
        level: buildableAndLevel.level,
      });
      self.panelClickedState = PlayerIngredientPanelState.LOCKED_INGREDIENT_CLICKED;
    }
  },
});
cc.Class(ClassOption);

