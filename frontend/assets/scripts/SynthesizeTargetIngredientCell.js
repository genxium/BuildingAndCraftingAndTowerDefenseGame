const RecipeTargetIngredientPageCell = require('./RecipeTargetIngredientPageCell');
const StateBasedFactory = require('./modules/StateBasedFactory');

const SynthesizeTargetState = cc.Enum({
  LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN: 0,
  UNLOCKED_DISPLAY_NAME_CONSUMABLES_AVAILABLE: 1,
  UNLOCKED_DISPLAY_NAME_CONSUMABLES_UNAVAILABLE: 2,
  UNLOCKED_REQUIRED_BUILDABLE_LEVEL_NOT_MATCH: 3,
});

const ClassOption = StateBasedFactory(SynthesizeTargetState);

Object.assign(ClassOption.properties, {
  toggleView: {
    default: false,
    override: true,
    visible: false,
  }
});

Object.assign(ClassOption, {
  extends: RecipeTargetIngredientPageCell,
  refresh() {
    const self = this;
    if (!CC_EDITOR) {
      RecipeTargetIngredientPageCell.prototype.refresh.apply(self, arguments);
    }
    let spriteFrames = self.sprites;
    spriteFrames.forEach(function(sprite) {
      sprite.setState(self.state == SynthesizeTargetState.UNLOCKED_REQUIRED_BUILDABLE_LEVEL_NOT_MATCH ? cc.Sprite.State.GRAY : cc.Sprite.State.NORMAL);
    });
  },
  onStateChanged(prev, current) {
    const self = this;
    self.refresh();
  },
  isEnabledState() {
    const self = this;
    return self.node.active && self.data && self.recipe && self.state == SynthesizeTargetState.UNLOCKED_DISPLAY_NAME_CONSUMABLES_AVAILABLE;
  },
});

cc.Class(ClassOption);


module.exports.STATE = SynthesizeTargetState;
