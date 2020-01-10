const CraftingSystemPanel = require('./CraftingSystemPanel'),
      StatefulBuildableIngredientProgressListPanel = require('./StatefulBuildableIngredientProgressListPanel'),
      IngredientProgressList = require('./IngredientProgressList');
const SynthesizeTargetState = require('./SynthesizeTargetIngredientCell').STATE;
cc.Class({
  extends: CraftingSystemPanel,
  properties: {
    ingredientCellPrefab: {
      type: cc.Prefab,
      override: true,
      visible: false,
      default: null,
    },
    craftingIngredientListNode: {
      type: cc.Node,
      override: true,
      visible: false,
      default: null,
    },
    craftingButton: {
      type: cc.Button,
      override: true,
      visible: false,
      default: null,
    },
    mainContainerNode: {
      type: cc.Node,
      override: true,
      visible: false,
      default: null,
    },
    costGoldValueLable: {
      type: cc.Label,
      override: true,
      visible: false,
      default: null,
    },
    defaultClickHandler: {
      override: true,
      visible: false,
      default: false,
    },
    clearAllButton: {
      type: cc.Button,
      default: null,
      visible: false,
      override: true,
    },
    ingredientProgressListPanel: StatefulBuildableIngredientProgressListPanel,
    recipeBindingPrefab: cc.Prefab,
  },
  onLoad() {
    const self = this;
    self.defaultClickHandler = false;
    CraftingSystemPanel.prototype.onLoad.apply(self, arguments);
    self.ingredientProgressListPanel.onRefresh = function(ingredientList, ingredientProgressList) {
      self.setData(self.recipeList, ingredientProgressList);
      self.refresh();
      self.onRefresh && self.onRefresh();
    }
  },
  onEnable() {
    const self = this;
    CraftingSystemPanel.prototype.onEnable && CraftingSystemPanel.prototype.onEnable.apply(self, arguments);
    if (self.statefulBuildableInstance && self.highlightedStatefulBuildableInstanceNode) {
      self.statefulBuildableInstance.cloneAnimation(self.highlightedStatefulBuildableInstanceNode);
    }
  },
  onIngredientEnterCollider() {
    const self = this;
    CraftingSystemPanel.prototype.onIngredientEnterCollider.apply(self, arguments);
    let action = self.statefulBuildableInstance._createRightIngredientAcceptAction();
    self.statefulBuildableInstance._playIngredientAcceptAnim(self.highlightedStatefulBuildableInstanceNode, action);
  },
  onIngredientExitCollider() {
    const self = this;
    CraftingSystemPanel.prototype.onIngredientExitCollider.apply(self, arguments);
    self.statefulBuildableInstance._stopIngredientAcceptAnim(self.highlightedStatefulBuildableInstanceAnimationNode);
  },
  init(mapIns, statefulBuildableInstance) {
    const self = this;
    CraftingSystemPanel.prototype.init.call(self, mapIns);
    self.statefulBuildableInstance = statefulBuildableInstance;
    
    self.craftingButton = new cc.Node().addComponent(cc.Button);
    self.clearAllButton = new cc.Node().addComponent(cc.Button);
    self.costGoldValueLable = new cc.Node().addComponent(cc.Label);
    self.craftingIngredientListNode = new cc.Node();

    // Highlight the statefulBuildableInstance [begin].
    if (null != self.highlightedStatefulBuildableInstanceNode) {
      self.highlightedStatefulBuildableInstanceNode.removeFromParent();
      self.highlightedStatefulBuildableInstanceNode = null;
    }
    self.highlightedStatefulBuildableInstanceNode = cc.instantiate(statefulBuildableInstance.node);
    self.highlightedStatefulBuildableInstanceNode.position = cc.v2(0, 0);
    self.highlightedStatefulBuildableInstanceNode.scale = mapIns.mainCamera.zoomRatio;

    self.highlightedStatefulBuildableInstanceAnimationNode = self.highlightedStatefulBuildableInstanceNode;
    
    safelyAddChild(self.node, self.highlightedStatefulBuildableInstanceNode);
    // Highlight the statefulBuildableInstance [end].

    // Initialization of ingredientProgressListPanel [begin].
    self.ingredientProgressListPanel.init(mapIns, statefulBuildableInstance);
    self.ingredientProgressListPanel.boost = function() {
      self.interactable = false;
      StatefulBuildableIngredientProgressListPanel.prototype.boost.apply(this, arguments);
    };
    self.ingredientProgressListPanel._onBoostSucceed = function() {
      self.interactable = true;
      StatefulBuildableIngredientProgressListPanel.prototype._onBoostSucceed.apply(this, arguments);
    };
    self.ingredientProgressListPanel._onBoostFailed = function() {
      self.interactable = true;
      StatefulBuildableIngredientProgressListPanel.prototype._onBoostFailed.apply(this, arguments);
    };
    self.ingredientProgressListPanel.onRefresh = function() {
      self.ingredientProgressList = self.ingredientProgressListPanel.data;
    }
    // Initialization of ingredientProgressListPanel [end].
  },
  setData(recipeList, ingredientProgressList) {
    const self = this;
    let ingredientList = recipeList.map(function(playerRecipe) {
      return playerRecipe.targetIngredient;
    });
    const fakeKnapsackArray = ingredientList.map(function(ingredient) {
      return {
        id: -1, currentCount: 1,
        ingredient: ingredient,
      };
    });
    CraftingSystemPanel.prototype.setData.call(self, fakeKnapsackArray);
    self.recipeList = recipeList;
    self.ingredientProgressList = ingredientProgressList;
    self.ingredientProgressListPanel.setData(ingredientProgressList);
  },
  refresh() {
    const self = this;
    
    CraftingSystemPanel.prototype.refresh.call(self);
    self.ingredientProgressListPanel.refresh();

    // Update the state of synthesizeTargetIngredientCell [begin].
    self.getAllIngredientPageCell().forEach(function(ingredientPageCell, index) {
      let synthesizeTargetIngredientCell = ingredientPageCell.node.getComponent('SynthesizeTargetIngredientCell');
      let playerRecipe = self.recipeList[index];
      let mininumLevel = self.mapIns.getMinimunLevelToSynthesizePlayerRecipe(playerRecipe, self.statefulBuildableInstance.id);
      synthesizeTargetIngredientCell.setData(synthesizeTargetIngredientCell.data, null, playerRecipe, mininumLevel);
      if (playerRecipe.state == constants.RECIPE.STATE.UNLOCKED || playerRecipe.state == constants.RECIPE.STATE.LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN) {
        if (synthesizeTargetIngredientCell.requiredLevel > self.statefulBuildableInstance.currentLevel) {
          synthesizeTargetIngredientCell.state = SynthesizeTargetState.UNLOCKED_REQUIRED_BUILDABLE_LEVEL_NOT_MATCH;
        } else {
          synthesizeTargetIngredientCell.state = self.mapIns.isRecipeSynthesizable(playerRecipe) ? SynthesizeTargetState.UNLOCKED_DISPLAY_NAME_CONSUMABLES_AVAILABLE : SynthesizeTargetState.UNLOCKED_DISPLAY_NAME_CONSUMABLES_UNAVAILABLE;
        }
      } else {
        synthesizeTargetIngredientCell.state = SynthesizeTargetState.LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN;
      }
      synthesizeTargetIngredientCell.data.currentCount = synthesizeTargetIngredientCell.state == SynthesizeTargetState.UNLOCKED_DISPLAY_NAME_CONSUMABLES_AVAILABLE ? 1 : 0;
    });
    // Update the state of synthesizeTargetIngredientCell [end].

    // RefreshOrInitialization of recipeBinding [begin].
    self.getAllIngredientPageCell().forEach(function(ingredientPageCell, index) {
      self.initRecipeBindingPopup(ingredientPageCell, self.recipeList[index]);
      let recipeBindingIns = ingredientPageCell.recipeBindingIns;
      recipeBindingIns.refresh();
      recipeBindingIns.targetIngredientPageCell.displayNameLabel.string = i18nExtend.render('RecipeBindingPopup.title', {name: recipeBindingIns.targetIngredientPageCell.displayNameLabel.string});
      recipeBindingIns.consumableListNode.children.forEach(function(node) {
        let consumableCellIns = node.getComponent('RecipeConsumableCell'),
            currentCount = consumableCellIns.data.currentCount,
            requiredCount = consumableCellIns.consumableData.count;
        consumableCellIns.countLabel.node.color = currentCount < requiredCount ? cc.color('#DE5244') : cc.color('#3B74A5');
      });
    });
    // RefreshOrInitialization of recipeBinding [end].
  },
  initRecipeBindingPopup(ingredientPageCell, playerRecipe) {
    const self = this;
    if (null != ingredientPageCell.recipeBindingIns) {
      return;
    }
    const recipeBindingNode = cc.instantiate(self.recipeBindingPrefab),
          recipeBindingIns = recipeBindingNode.getComponent('StatefulBuildableRecipeBinding');
    recipeBindingIns.init(self.mapIns, self.statefulBuildableInstance);
    recipeBindingIns.setData(playerRecipe);
    recipeBindingIns.state = ingredientPageCell.state;
    ingredientPageCell.node.on(cc.Node.EventType.TOUCH_START, function() {
      let ingredientPageCellPositionUnderWorld = ingredientPageCell.node.convertToWorldSpaceAR(cc.v2()),
        selfNodePositionUnderWorld = self.node.convertToWorldSpaceAR(cc.v2());
      recipeBindingNode.position = ingredientPageCellPositionUnderWorld.sub(selfNodePositionUnderWorld).add(cc.v2(0, ingredientPageCell.node.height / 2));
      recipeBindingNode.active = true;
    });
    ingredientPageCell.node.on(cc.Node.EventType.TOUCH_MOVE, function(evt) {
      if (!ingredientPageCell.isTouchPointInsideBoundingNode(evt.getLocation())) {
        recipeBindingNode.active = false;
      }
    });
    ingredientPageCell.node.on(cc.Node.EventType.TOUCH_END, function() {
      recipeBindingNode.active = false;
    })
    ingredientPageCell.node.on(constants.EVENT.DRAGGING.START, function() {
      recipeBindingNode.active = false;
    });

    // WARNING: ingredientPageCell.children could invisible because of the Mask in ingredientPageView. 
    safelyAddChild(self.node, recipeBindingNode);
    recipeBindingNode.active = false;
    ingredientPageCell.recipeBindingNode = recipeBindingNode;
    ingredientPageCell.recipeBindingIns = recipeBindingIns;
  },
  onReceiveIngredient(relatedingredientCellIns) {
    const self = this;
    
    const ingredient = relatedingredientCellIns.data.ingredient;
    const targetPlayerRecipe = self.recipeList.find(function(playerRecipe) {
      return playerRecipe.targetIngredient.id == ingredient.id;
    });
    self.interactable = false;
    self.setState(window.AJAX_STATE.WAITING);
    self.mapIns.synthesizeRecipe(self.statefulBuildableInstance, targetPlayerRecipe, function successCb(res) {
      self.interactable = true;
      self.setState(window.AJAX_STATE.SUCCEED);
      self.setData(self.recipeList, res.ingredientProgressList);
      self.refresh();
      self.onRefresh && self.onRefresh();
    }, function failCb(err, res) {
      self.interactable = true;
      self.setState(window.AJAX_STATE.FAILED);
    });
  },
  resizeNode() {
  
  },
});
