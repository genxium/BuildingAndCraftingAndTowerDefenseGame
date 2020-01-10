const AjaxQueryResultPanel = require('./AjaxQueryResultPanel');
const i18nExtend = require('./modules/i18n-extends');
const i18nCompiler = new i18nExtend('CraftingResultPanel');
const displayNameCompiler = new i18nExtend('Ingredient.DisplayName');
const IngredientProgressCell = require('./IngredientProgressCell');


cc.Class({
  extends: AjaxQueryResultPanel,
  properties: {
    succeededResultTitle: cc.Label,
    appearance: cc.Sprite,
    displayNameTip: cc.Label,
    ingredientProgressCell: IngredientProgressCell,
    boostButton: cc.Button,
  },

  onLoad() {
    const self = this;
    AjaxQueryResultPanel.prototype.onLoad && AjaxQueryResultPanel.prototype.onLoad.call(self);
    self.boostButton.node.on('click', function() {
      self.onBoost && self.onBoost(self.ingredientProgressCell.countRestDuration());
    });
  },

  ctor() {
    const self = this;
    // To gray the failed Node's Sprite. [begins]
    if (null != self.queryFailedNode) {
      for (let childNode of self.queryFailedNode.children) {
        let sprite = childNode.getComponent(cc.Sprite);
        if (null != sprite) {
          const GraySpriteMaterial = cc.Material.getBuiltinMaterial('2d-gray-sprite');
          sprite.setMaterial(0, GraySpriteMaterial);

        }
      }
    }
    // To gray the failed Node's Sprite. [ends]
  },

  init(mapIns, craftingSystemPanelIns) {
    const self = this;
    self.mapIns = mapIns;
    self.craftingSystemPanelIns = craftingSystemPanelIns;
    self.ingredientProgressCell.init(mapIns);
    self.ingredientProgressCell.onCollect = function() {
      self.onCellCollect && self.onCellCollect(self.ingredientProgressCell.ingredientProgress);
    };
    self.ingredientProgressCell.onCancel = function() {
      self.onCellCancel && self.onCellCancel(self.ingredientProgressCell.ingredientProgress);
    };
    self.ingredientProgressCell.onProduceDone = function() {
      if (self.ingredientProgressCell.isAutoCollect()) {
	const statefulBuildableInstance = self.craftingSystemPanelIns.statefulBuildableInstance;
	const playerBuildableBindingId = statefulBuildableInstance.playerBuildableBinding.id;
	self.mapIns.sendIngredientListQuery(playerBuildableBindingId, statefulBuildableInstance.autoCollect, function({ingredientList, ingredientProgressList}) {
	  if (null != ingredientProgressList && 0 < ingredientProgressList.length) {
	    console.warn('some autocollect ingredientProgress has not be collect automatically.');
	  }
          self.craftingSystemPanelIns.setData(self.mapIns.getCraftableKnapsackArray());
          self.craftingSystemPanelIns.refresh();
          self.ingredientProgress = null;
          self.onCloseClicked(null);
	});
      }
    }
    if (null == self._originalCloseDelegate && null != self.craftingSystemPanelIns.onCloseDelegate) {
      self._originalCloseDelegate = self.craftingSystemPanelIns.onCloseDelegate;
      self.craftingSystemPanelIns.onCloseDelegate = function(evt) {
        self._onCraftingSystemPanelInsClosed(evt);
      };
    }
  },

  onEnable() {
    const self = this;
    AjaxQueryResultPanel.prototype.onEnable.apply(self, arguments);
    if (null == self._originalCloseDelegate && null != self.craftingSystemPanelIns.onCloseDelegate) {
      self._originalCloseDelegate = self.craftingSystemPanelIns.onCloseDelegate;
      self.craftingSystemPanelIns.onCloseDelegate = function(evt) {
        self._onCraftingSystemPanelInsClosed(evt);
      };
    }
  },

  onDisable() {
    const self = this;
    AjaxQueryResultPanel.prototype.onDisable.apply(self, arguments);
    if (null != self._originalCloseDelegate) {
      self.craftingSystemPanelIns.onCloseDelegate = self._originalCloseDelegate;
      self._originalCloseDelegate = null;
    }
  },

  _onCraftingSystemPanelInsClosed(evt) {
    const self = this;
    self._originalCloseDelegate.call(self.craftingSystemPanelIns, evt);
    self.onCloseClicked(null);
  },

  beforeWaiting() {
    const self = this;
    AjaxQueryResultPanel.prototype.beforeWaiting.apply(self, arguments);
    self.closeBtn.node.active = false;
  },

  beforeResponeded() {
    const self = this;
    AjaxQueryResultPanel.prototype.beforeResponeded.apply(self, arguments);
    if (self.isSucceed()) {
      self.node.width = self.querySucceedNode.width;
      self.node.height = self.querySucceedNode.height;
    } else {
      self.node.width = self.queryFailedNode.width;
      self.node.height = self.queryFailedNode.height;
    }
  },

  onFailed() {
    const self = this;
    self.closeBtn.node.active = true;
  },

  beforeSucceed(ingredient, ingredientProgress, retType) {
    const self = this;
    let displayNameTipKey = '';
    if (null != ingredient) {
      self.succeededResultTitle.string = i18nCompiler.render('Title.succeed');
      self.appearance.spriteFrame = ingredient.appearance;
      self.appearance.node.color = cc.Color.WHITE;
      if (retType.isRecipeKnown && retType.isIngredientKnown) {
        displayNameTipKey = 'Tip.Succeed.RecipeKnown.ingredientKnown';
      } else if (retType.isRecipeKnown && !retType.isIngredientKnown) {
        displayNameTipKey = 'Tip.Succeed.RecipeKnown.ingredientNew';
      } else if (!retType.isRecipeKnown && retType.isIngredientKnown) {
        displayNameTipKey = 'Tip.Succeed.RecipeNew.ingredientKnown';
      } else if (!retType.isRecipeKnown && !retType.isIngredientKnown) {
        displayNameTipKey = 'Tip.Succeed.RecipeNew.ingredientNew';
      }
      self.closeBtn.node.active = true;
      self.ingredientProgressCell.completedTip.active = true;
      self.ingredientProgressCell.node.active = false;
      let displayName = displayNameCompiler.render(ingredient.name);
      self.displayNameTip.string = i18nCompiler.render(displayNameTipKey, {displayName});
    } else if (null != ingredientProgress) {
      if (null != ingredientProgress.ingredientId) {
        ingredient = self.mapIns.getIngredientById(ingredientProgress.ingredientId);
        self.appearance.spriteFrame = ingredient.appearance;
      } else {
        ingredient = null;
        self.appearance.node.active = false;
      }
      self.succeededResultTitle.string = i18nCompiler.render('Title.waiting');
      self.appearance.node.color = cc.Color.BLACK;
      self.ingredientProgressCell.node.active = true;
      self.ingredientProgressCell.setData(ingredientProgress);
      self.ingredientProgressCell.refresh = function() {
        IngredientProgressCell.prototype.refresh.call(self.ingredientProgressCell, arguments);
        // check if the recipe is state3.
        if (null != ingredientProgress.recipeId) {
          let playerRecipe = self.mapIns.getPlayerRecipeById(ingredientProgress.recipeId);
          if (playerRecipe.state != constants.RECIPE.STATE.UNLOCKED) {
            self.ingredientProgressCell.appearance.node.color = cc.Color.BLACK;
          } else {
            self.ingredientProgressCell.appearance.node.color = cc.Color.WHITE;
          }
        } else {
          console.warn(`IngredientProgress for crafting should has a recipeId.`);
        }

        if (self.ingredientProgressCell.isCompleted()) {
          self.ingredientProgressCell.appearance.node.color = cc.Color.WHITE;
          self.ingredientProgressCell.collectButton.node.active = true;
          self.boostButton.node.active = false;   
        } else {
          self.ingredientProgressCell.collectButton.node.active = false;
          self.boostButton.node.active = self.mapIns.boostEnabled;
        }
        if (!self.mapIns.boostEnabled) {
          self.ingredientProgressCell.cancelButton.node.x = 0;
        }
        displayNameTipKey = self.ingredientProgressCell.isCompleted() ? 'Tip.Succeed.RecipeKnown.ingredientKnown' : 'Tip.Succeed.crafting';
        self.succeededResultTitle.string = self.ingredientProgressCell.isCompleted() ? i18nCompiler.render('Title.succeed') : i18nCompiler.render('Title.waiting');
        // TODO: fix this. [begin]
        let displayName;
        if (null != ingredientProgress.ingredientId) {
          displayName = displayNameCompiler.render(ingredient.name);
        } else {
          displayName = self.ingredientProgressCell.ingredientProgress.targetIngredientList.map(function(ingredient) {
            return displayNameCompiler.render(ingredient.name);
          }).join('+');
        }
        // TODO: fix this. [end]
        self.displayNameTip.string = i18nCompiler.render(displayNameTipKey, {displayName});
      }
      self.ingredientProgressCell.refresh();
    } else {
      self.craftingSystemPanelIns.setData(self.mapIns.getCraftableKnapsackArray());
      self.craftingSystemPanelIns.refresh();
      self.ingredientProgress = null;
      self.onCloseClicked(null);
 
    }
    // WARNING: Deliberately put it in the bottom of function.
    AjaxQueryResultPanel.prototype.beforeSucceed.apply(self, arguments);
  },
  onSucceed(ingredient, ingredientProgress, retType) {
    const self = this;
    AjaxQueryResultPanel.prototype.beforeSucceed.apply(self, arguments);
    self.ingredient = ingredient;
    self.ingredientProgress = ingredientProgress;
    self.onRefresh && self.onRefresh(ingredient, ingredientProgress, retType);
  },
});
