const RecipeBinding = require('./RecipeBinding');
const SynthesizeTargetState = require('./SynthesizeTargetIngredientCell').STATE;
const StateBasedFactory = require('./modules/StateBasedFactory');
const i18nExtend = require('./modules/i18n-extends');

const ClassOption = StateBasedFactory(SynthesizeTargetState);

Object.assign(ClassOption.properties, {
  requiredBuildableLevelLabel: cc.Label,
});

Object.assign(ClassOption, {
  extends: RecipeBinding,
  init(mapIns, statefulBuildableInstance) {
    const self = this;
    RecipeBinding.prototype.init.apply(self, arguments);
    self.statefulBuildableInstance = statefulBuildableInstance;
  },
  setData() {
    const self = this;
    RecipeBinding.prototype.setData.apply(self, arguments);
    self.requiredLevel = self.mapIns.getMinimunLevelToSynthesizePlayerRecipe(self.recipe, self.statefulBuildableInstance.id);
    self.requiredBuildableLevelLabel.string = i18nExtend.render('RecipeBindingPopup.Tip.requiredLevel', { level: self.requiredLevel, });
  },
  onStateChanged(prev, current) {
    const self = this;
    if (CC_EDITOR) {
      return;
    }
    self.refresh();
  },
});

cc.Class(ClassOption);


module.exports.STATE = SynthesizeTargetState;
