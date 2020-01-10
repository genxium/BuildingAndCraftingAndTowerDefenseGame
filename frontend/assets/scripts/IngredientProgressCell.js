const ProgressNum = require("./ProgressNum");
cc.Class({
  extends: cc.Component,
  properties: {
    elapsedTimeProgress: ProgressNum,
    cancelButton: cc.Button,
    collectButton: cc.Button,
    appearance: cc.Sprite,
    cancelEnabled: true,
    completedTip: cc.Node,
    useWidgets: false,
    ratio: {
      tooltip: 'Ratio is the value of width / height',
      type: cc.Float,
      default: 1,
      visible: function() {
        return this.useWidgets;
      },
    },
    pendingInQueueTip: cc.Node,
    targetIngredientListNode: cc.Node,
    ingredientCellPrefab: cc.Prefab,
  },

  onLoad() {
    const self = this;
    if (self.cancelButton) {
      const cancelButtonEventHandler = new cc.Component.EventHandler();
      cancelButtonEventHandler.target = self.node;
      cancelButtonEventHandler.component = self.node.name;
      cancelButtonEventHandler.handler = "onCancelButtonClicked";
      self.cancelButton.clickEvents = [
        cancelButtonEventHandler
      ];
    }
    if (self.collectButton) {
      const collectButtonEventHandler = new cc.Component.EventHandler();
      collectButtonEventHandler.target = self.node;
      collectButtonEventHandler.component = self.node.name;
      collectButtonEventHandler.handler = "onCollectButtonClicked";
      self.collectButton.clickEvents = [
        collectButtonEventHandler
      ];
    }
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },

  setData(ingredientProgress) {
    const self = this;
    // TODO: Is it safely to assign data here?
    ingredientProgress = Object.assign({}, ingredientProgress);
    ingredientProgress.targetIngredientList = [];
    ingredientProgress.targetIngredientListCount = [];
    if (null != ingredientProgress.ingredientId) {
      ingredientProgress.appearance = self.mapIns.getIngredientAppearance(ingredientProgress.ingredientId);
      ingredientProgress.targetIngredientList.push(self.mapIns.getIngredientById(ingredientProgress.ingredientId));
      ingredientProgress.targetIngredientListCount.push(ingredientProgress.targetIngredientCount);
    } else if (null != ingredientProgress.recipeId) {
      let playerRecipe = self.mapIns.getPlayerRecipeById(ingredientProgress.recipeId);
      playerRecipe.targetIngredientList.forEach(function(ingredient) {
        ingredientProgress.targetIngredientList.push(ingredient);
        ingredientProgress.targetIngredientListCount.push(
          playerRecipe.recipeIngredientBindingList.find(function(recipeIngredientBinding) {
            return recipeIngredientBinding.prependedBinocularOperator == constants.RECIPE.PREPENDED_BINOCULAR_OPERATOR.RESULT &&
              recipeIngredientBinding.ingredientId == ingredient.id;
          }).count
        );
      });
    } else {
      console.warn(`why ingredientId & recipeId is null at the same time?`);
    }
    self.ingredientProgress = ingredientProgress;
    self.collected = false;
    if (ingredientProgress.startedAt) {
      self.elapsedTimeProgress.node.active = true;
      console.log("Starting to refresh the progressbar For ingredientProgress ", ingredientProgress);
      self.elapsedTimeProgress.setData(null, ingredientProgress.durationMillis, ingredientProgress.startedAt);
    } else {
      self.elapsedTimeProgress.node.active = false;
    }
  },

  refresh() {
    const self = this, ingredientProgress = self.ingredientProgress;
    const elapsedTimeProgress = self.elapsedTimeProgress;
    if (null != ingredientProgress.ingredientId) {
      self.appearance.spriteFrame = ingredientProgress.appearance;
      if (null != self.targetIngredientListNode) {
        self.targetIngredientListNode.active = false;
      } else {
        console.warn(`You might have forgotten to set this value: targetIngredientListNode?`);
      }
    } else if (null != self.targetIngredientListNode) {
      self.appearance.node.active = false;
      self.targetIngredientListNode.removeAllChildren();
      // begin render multi-target [begin].
      ingredientProgress.targetIngredientList.forEach(function(ingredient, index) {
        let count = ingredientProgress.targetIngredientListCount[index];
        let ingredientNode = cc.instantiate(self.ingredientCellPrefab);
        let ingredientCellIns = ingredientNode.getComponent('IngredientCell');
        ingredientCellIns.init(self.mapIns);
        ingredientCellIns.setData({id: -1, currentCount: count, ingredient: ingredient});
        self.targetIngredientListNode.addChild(ingredientNode);
        ingredientCellIns.refresh();

      });
      // begin render multi-target [end].
    } else {
      console.warn("Please fix ingredientProgressCell to support multi-target recipe.");
      self.appearance.spriteFrame = ingredientProgress.targetIngredientList[0].appearance;
    }
   
    // refresh visible of cancelButton.
    if (self.isProducing() || self.isReclaiming() || self.isPendingInQueue()) {
      self.cancelButton.node.active = self.cancelEnabled ? true : false;
    } else {
      self.cancelButton.node.active = false;
    }

    // refresh visible of elapsedTimeProgress
    if (self.isProducing() || self.isReclaiming()) {
      elapsedTimeProgress.node.active = true;
    } else {
      elapsedTimeProgress.node.active = false;
    }

    // refresh interactable of collectButton 
    if (self.isCouldCollected()) {
      self.enableCollect();
    } else {
      self.disableCollect();
    }

    // refresh visible of pendingInQueueTip
    if (self.isPendingInQueue()) {
      self.pendingInQueueTip.active = true;
    } else {
      self.pendingInQueueTip.active = false;
    }

    // refresh visible of completedTip
    if (self.isCompleted()) {
      self.completedTip.active = true;
      let nodeHiddenWhenCompleted = [self.cancelButton.node, self.elapsedTimeProgress.node, self.pendingInQueueTip];
      nodeHiddenWhenCompleted.forEach(function(node) {
        node.active = false;
      });
    } else {
      self.completedTip.active = false;
    }

    if (self.useWidgets) {
      let widget = self.node.getComponent(cc.Widget);
      widget.enabled = true;
      widget.top = self.isPendingInQueue() ? 0.063 : 0;
      widget.isAbsoluteTop = false;
      widget.updateAlignment();
      self.node.width = self.node.height * self.ratio;
      self.node.getComponentsInChildren(function(widget) {
        widget.updateAlignment();
      });
      self.elapsedTimeProgress.progressBar.totalLength = self.elapsedTimeProgress.progressBar.node.width;
    }

  },

  update(dt) {
    const self = this, elapsedTimeProgress = self.elapsedTimeProgress, ingredientProgress = self.ingredientProgress;
    if (self.collected) {
      return;
    }
    if (ingredientProgress && null != ingredientProgress.startedAt && (self.isProducing() || self.isReclaiming() || self.isSynthesizing()) && Date.now() >= (ingredientProgress.startedAt + ingredientProgress.durationMillis )) {
      self.transitToCompleted();
      self.onProduceDone && self.onProduceDone();
      self.refresh();
    }
  },

  onCancelButtonClicked(evt) {
    const self = this;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    if (self.onCancel) {
      self.onCancel(self.ingredientProgress);
    }
  },

  onCollectButtonClicked(evt) {
    const self = this;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    if (self.isAutoCollect()) {
      return;
    }
    self.collect();
  },

  collect() {
    const self = this;
    if (self.collected) {
      return;
    }
    self.collected = true;
    self.onCollect && self.onCollect();
  },

  enableCollect() {
    const self = this;
    self.collectButton.interactable = true;
  },

  disableCollect() {
    const self = this;
    self.collectButton.interactable = false;
  },

  isAutoCollect() {
    const self = this;
    switch (self.ingredientProgress.state) {
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED:
        return true;
      default:
        return false;
    }
  },

  transitToCompleted() {
    /*
    * This method only works LOCALLY to write the "ingredientProgress.state in RAM". 
    */ 
    const self = this;
    self.ingredientProgress.recipeId = null;
    switch (self.ingredientProgress.state) {
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_MANUALLY_COLLECTED:
        self.ingredientProgress.state = constants.INGREDIENT_PROGRESS_STATE.COMPLETED_TO_BE_MANUALLY_COLLECTED;
        break; 
      case constants.INGREDIENT_PROGRESS_STATE.RECLAIMING_TO_BE_MANUALLY_COLLECTED:
        self.ingredientProgress.state = constants.INGREDIENT_PROGRESS_STATE.RECLAIMED_TO_BE_MANUALLY_COLLECTED;
        break;
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
        self.ingredientProgress.startedAt = null;
        break;
      default:
        self.ingredientProgress.startedAt = null;
        break;
    }

  },

  isCompleted() {
    const self = this;
    const ingredientProgress = self.ingredientProgress;
    switch (ingredientProgress.state) {
      case constants.INGREDIENT_PROGRESS_STATE.COMPLETED_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.RECLAIMED_TO_BE_MANUALLY_COLLECTED:
        return true;
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
        return null == self.ingredientProgress.startedAt;
      default:
        if (
          null != self.ingredientProgress.startedAt
          &&
          (self.isProducing() || self.isReclaiming() || self.isSynthesizing())
        ) {
          return Date.now() >= (ingredientProgress.startedAt + ingredientProgress.durationMillis);
        }
        break;
    }
    return false;
  },

  isProducing() {
    const self = this;
    switch (self.ingredientProgress.state) {
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
        return true;
      default:
        return false;
    }
  },

  isReclaiming() {
    const self = this;
    switch (self.ingredientProgress.state) {
      case constants.INGREDIENT_PROGRESS_STATE.RECLAIMING_TO_BE_MANUALLY_COLLECTED:
        return true;
      default:
        return false;
    }
  },

  isSynthesizing() {
    const self = this;
    return self.ingredientProgress.recipeId != null;
  },

  isCouldCollected() {
    const self = this;
    switch (self.ingredientProgress.state) {
      case constants.INGREDIENT_PROGRESS_STATE.COMPLETED_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.RECLAIMED_TO_BE_MANUALLY_COLLECTED:
        return true;
      default:
        return false;
    }
  },

  isPendingInQueue() {
    const self = this;
    switch (self.ingredientProgress.state) {
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED:
        return true;
      default:
        return false;
    }
  },

  countRestDuration() {
    const self = this, ingredientProgress = self.ingredientProgress;
    switch (ingredientProgress.state) {
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.RECLAIMING_TO_BE_MANUALLY_COLLECTED:
        return Math.max(0, ingredientProgress.durationMillis - (Date.now() - ingredientProgress.startedAt));
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED:
        return ingredientProgress.durationMillis;
      case constants.INGREDIENT_PROGRESS_STATE.COMPLETED_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.RECLAIMED_TO_BE_MANUALLY_COLLECTED:
        return 0;
      default:
        return 0;
    }
  },

});
