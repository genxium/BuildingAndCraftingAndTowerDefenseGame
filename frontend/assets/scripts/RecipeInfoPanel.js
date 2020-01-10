const Ingredient = require("./Ingredient"), RecipeBindind = require("./RecipeBinding");
const i18nExtends = require('./modules/i18n-extends'),
      i18nIngredientCompiler = new i18nExtends('Ingredient');
const CloseableDialog = require('./CloseableDialog');
const StateBasedFactory = require('./modules/StateBasedFactory');

const RecipeState = cc.Enum({
  LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN: 0,
  UNLOCKED: 1,
});

const ClassOption = StateBasedFactory(RecipeState, RecipeState.UNLOCKED);
Object.assign(ClassOption.properties, {
  targetIngredient: Ingredient,
  recipeBindingCellPrefab: cc.Prefab,
  requiredCraftedLabel: cc.Label,
  recipeUnlockedLabel: cc.Label,
  recipeListPageView: cc.PageView,
});
Object.assign(ClassOption, {
  extends: CloseableDialog,
  init(mapIns, specifiedBuildableId) {
    const self = this;
    self.mapIns = mapIns;
    self.buildableId = specifiedBuildableId;
    self.targetIngredient.init(mapIns);
    // Initialization of PageEvent [begin].
    let pageTurningEventHandler = new cc.Component.EventHandler();
    pageTurningEventHandler.target = self.node;
    pageTurningEventHandler.component = 'RecipeInfoPanel';
    pageTurningEventHandler.handler = 'onRecipeTurning';
    self.recipeListPageView.pageEvents = [
      pageTurningEventHandler
    ];
    // Initialization of PageEvent [end].

  },

  onRecipeTurning() {
    const self = this, index = self.recipeListPageView.getCurrentPageIndex();
    const playerRecipe = self.recipeListData[index];
    switch (playerRecipe.state) {
      case constants.RECIPE.STATE.LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN:
        self.state = RecipeState.LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN;
        break;
      case constants.RECIPE.STATE.UNLOCKED:
        self.state = RecipeState.UNLOCKED;
        break;
      default:
        console.warn(`Recipe info hasn't handle this state yet: ${playerRecipe.state}`);
        break;
    }
  },

  setData(ingredient, recipeList) {
    const self = this;
    self.ingredient = ingredient;
    self.recipeListData = recipeList;
    self.targetIngredient.setData(ingredient);
    self.requiredCraftedLabel.string = i18nIngredientCompiler.render('Tip.RequiredCrafted.' + ingredient.name);
    self.recipeUnlockedLabel.string = i18nIngredientCompiler.render('Tip.RecipeUnlocked.' + ingredient.name);
  },

  refresh() {
    const self = this;
    self.targetIngredient.refresh();
    self.recipeListPageView.removeAllPages();
    self.recipeListData.forEach(function(playerRecipe) {
      let recipeBindingCellNode = cc.instantiate(self.recipeBindingCellPrefab);
      let recipeBindingCellIns = recipeBindingCellNode.getComponent('RecipeBinding');
      recipeBindingCellIns.init(self.mapIns);
      recipeBindingCellIns.setData(playerRecipe, self.buildableId);
      recipeBindingCellIns.refresh();
      self.recipeListPageView.addPage(recipeBindingCellNode);
    });
    self.recipeListPageView.indicator.node.active = self.recipeListData.length > 1;
    self.onRecipeTurning();
  },
});

cc.Class(ClassOption);
