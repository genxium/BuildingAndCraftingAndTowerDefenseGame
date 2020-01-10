const IngredientProgressCell = require('./IngredientProgressCell');
const ProgressNum = require('./ProgressNum');

cc.Class({
  extends: cc.Component,
  properties: {
    ingredientProgressCell: IngredientProgressCell,
    toCollectIngredientNode: cc.Node,
    toCollectGoldNode: cc.Node,
    autoRefreshEnabled: true,
    coinFallPrefab: cc.Prefab,
    flyAndFadeDurationMillis: {
      // Should be larger than `Coin.durationMillis` of a single coin.
      default: 1000,
    },
    sumOfRestDuration: ProgressNum,
  },

  editor: {
    requireComponent: cc.Button,
  },

  onLoad() {
    const self = this;
    const selfClickedEventHandler = new cc.Component.EventHandler();
    selfClickedEventHandler.target = self.node;
    selfClickedEventHandler.component = self.node.name;
    selfClickedEventHandler.handler = "onSelfClicked";
    self.getComponent(cc.Button).clickEvents = [
      selfClickedEventHandler   
    ];
  },

  init(mapIns, statefulBuildableInstance, interactionType) {
    const self = this;
    self.mapIns = mapIns;
    self.statefulBuildableInstance = statefulBuildableInstance;
    self.interactionType = interactionType;
    self.ingredientProgressCell.init(mapIns);
    self.ingredientProgressCell.onProduceDone = function() {
      if (!self.autoRefreshEnabled) {
        return;
      }
      self.mapIns.sendIngredientListQuery(
        statefulBuildableInstance.playerBuildableBinding.id,
        statefulBuildableInstance.autoCollect,
        function({
          ingredientProgressList
        }) {
          self.setData(ingredientProgressList);
          self.refresh();
        }
      );
    }
  },

  filterIngredientProgressListByInteractionType(ingredientProgressList) {
    const self = this;
    if (null == ingredientProgressList) {
      return [];
    }
    return ingredientProgressList.filter(function(ingredientProgress) {
      const state = constants.INGREDIENT_PROGRESS_STATE;
      switch (self.interactionType) {
        case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_CONSUMABLE:
        case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_TARGET:
          if (null == ingredientProgress.recipeId) {
            return false;
          }
          switch (ingredientProgress.state) {
          case state.PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED:
          case state.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
          case state.PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED:
          case state.PRODUCING_TO_BE_MANUALLY_COLLECTED:
          case state.COMPLETED_TO_BE_MANUALLY_COLLECTED:
            return true;
          case state.PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED:
          case state.RECLAIMING_TO_BE_MANUALLY_COLLECTED:
          case state.RECLAIMED_TO_BE_MANUALLY_COLLECTED:
            return false;
          default:
            return false;
          }
        case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.PRODUCIBLE:
          if (null != ingredientProgress.recipeId) {
            return false;
          }
          switch (ingredientProgress.state) {
          case state.PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED:
          case state.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
          case state.PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED:
          case state.PRODUCING_TO_BE_MANUALLY_COLLECTED:
          case state.COMPLETED_TO_BE_MANUALLY_COLLECTED:
            return true;
          case state.PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED:
          case state.RECLAIMING_TO_BE_MANUALLY_COLLECTED:
          case state.RECLAIMED_TO_BE_MANUALLY_COLLECTED:
            return false;
          default:
            return false;
          }
        case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.RECLAIM:
          if (null != ingredientProgress.recipeId) {
            return false;
          }
          switch (ingredientProgress.state) {
          case state.PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED:
          case state.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
          case state.PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED:
          case state.PRODUCING_TO_BE_MANUALLY_COLLECTED:
          case state.COMPLETED_TO_BE_MANUALLY_COLLECTED:
            return false;
          case state.PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED:
          case state.RECLAIMING_TO_BE_MANUALLY_COLLECTED:
          case state.RECLAIMED_TO_BE_MANUALLY_COLLECTED:
            return true;
          default:
            return false;
          }
        default:
          return false;
      }
    })
  },

  setData(ingredientProgressList) {
    const self = this;
    
    ingredientProgressList = self.filterIngredientProgressListByInteractionType(ingredientProgressList);

    self.data = ingredientProgressList;
    if (!ingredientProgressList.length) {
      self.currentIngredientProgress = null;
      return;
    }
    self.currentIngredientProgress = ingredientProgressList.find((ingredientProgress) => {
      return ingredientProgress.state == constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_MANUALLY_COLLECTED || ingredientProgress.state == constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED || ingredientProgress.state == constants.INGREDIENT_PROGRESS_STATE.RECLAIMING_TO_BE_MANUALLY_COLLECTED;
    });
    if (!self.currentIngredientProgress) {
      return;
    }

    self.ingredientProgressCell.setData(self.currentIngredientProgress);
    let isAutoCollect = self.statefulBuildableInstance.autoCollect;
    self.sumOfRestDuration.isForElapsedTimeProgress = true;
    self.sumOfRestDuration.setData(null, isAutoCollect ? self.currentIngredientProgress.durationMillis - (Date.now() - self.currentIngredientProgress.startedAt): self.countRestDuration(), Date.now());
  },

  refresh() {
    const self = this;
    if (null == self.data || !self.data.length) {
      self.onRefresh && self.onRefresh(null, []);
      self.node.active = false;
      return;
    }
    // if (self.statefulBuildableInstance.autoCollect) {
    //  self.hide();
    //  return;
    // }
    self.node.active = true;

    
    if (self.currentIngredientProgress) {
      self.hideCollectButton();
      self.ingredientProgressCell.node.active = true;
      self.ingredientProgressCell.refresh();
      self.sumOfRestDuration.node.active = true;
    } else {
      let sprite = self.toCollectIngredientNode.getComponent(cc.Sprite);
      let ingredientProgress = self.data;
      if (null != ingredientProgress[ingredientProgress.length-1].ingredientId) {
        sprite.spriteFrame = self.mapIns.getIngredientAppearance(ingredientProgress[ingredientProgress.length-1].ingredientId);
      } else {
        // TODO: To handle multi-target.
        self.node.active = false;
      }
      self.showCollectButton();
      self.ingredientProgressCell.node.active = false;
      self.sumOfRestDuration.node.active = false;
    }

    self.onRefresh && self.onRefresh(self.currentIngredientProgress, self.data);
  },

  showCollectButton() {
    const self = this;
    self.toCollectGoldNode.active = false;
    self.toCollectIngredientNode.active = false;
    switch (self.interactionType) {
      case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.PRODUCIBLE:
        break;
      case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_TARGET:
      case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_CONSUMABLE:
        self.toCollectIngredientNode.active = true;
        break;
      case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.RECLAIM:
        self.toCollectGoldNode.active = true;
        break;
    }
  },

  hideCollectButton() {
    const self = this;
    self.toCollectGoldNode.active = false;
    self.toCollectIngredientNode.active = false;
  },

  onSelfClicked() {
    const self = this;
    self.mapIns.onStatefulBuildableIngredientProgressListEntryClicked && self.mapIns.onStatefulBuildableIngredientProgressListEntryClicked(self.statefulBuildableInstance, self);
  },

  hasSomeOneProducing() {
    const self = this;
    return self.data.length ? null != self.currentIngredientProgress : false;
  },

  isEmpty() {
    const self = this;
    return !self.data.length;
  },

  playCollectAnim() {
    const self = this;
    switch (self.interactionType) {
      case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_TARGET:
      case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZE_CONSUMABLE:
        self.playIngredientFlyAnim();
        break;
      case constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.RECLAIM:
        self.playCoinFallAnim();
        break;
    }
  },

  playIngredientFlyAnim() {
    const self = this;
    let widgetsAboveAllScriptIns = self.mapIns.widgetsAboveAllScriptIns;
    let cloneNode = new cc.Node();
    cloneNode.addComponent(cc.Sprite);
    cloneNode.getComponent(cc.Sprite).spriteFrame = self.toCollectIngredientNode.getComponent(cc.Sprite).spriteFrame;
    safelyAddChild(self.node, cloneNode);
    window.flyAndFade(cloneNode, widgetsAboveAllScriptIns.knapsackButton.node, widgetsAboveAllScriptIns.node, self.flyAndFadeDurationMillis / 1000, false, true, () => {
      cloneNode.destroy();
    });
  },

  playCoinFallAnim(cb) {
    const self = this;
    const parentNode = this.node.parent;
    if (!parentNode) return;
    if (!this.coinFallPrefab) return;
    const coinFallNode = cc.instantiate(this.coinFallPrefab);

    //dirty hack
    const coinFallScriptIns = coinFallNode.getComponent("CoinFall");
    coinFallScriptIns.mapScriptIns = this.mapIns;
    coinFallScriptIns.finishCb = cb;
    coinFallScriptIns.flyAndFadeDurationMillis = self.flyAndFadeDurationMillis;
    coinFallNode.setPosition(cc.v2(0, this.node.y));
    safelyAddChild(parentNode, coinFallNode);
    setLocalZOrder(coinFallNode, 999);
    if (this.musicEffect)
      cc.audioEngine.playEffect(this.musicEffect, false, 1);

  },

  countRestDuration() {
    const self = this;
    if (!self.data || !self.data.length) {
      return 0;
    }
    return self.data.reduce((val, ingredientProgress) => {
      switch (ingredientProgress.state) {
        case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_MANUALLY_COLLECTED:
        case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
        case constants.INGREDIENT_PROGRESS_STATE.RECLAIMING_TO_BE_MANUALLY_COLLECTED:
          return val + Math.max(0, ingredientProgress.durationMillis - (Date.now() - ingredientProgress.startedAt));
        case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED:
        case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED:
        case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED:
          return val + ingredientProgress.durationMillis;
        case constants.INGREDIENT_PROGRESS_STATE.COMPLETED_TO_BE_MANUALLY_COLLECTED:
        case constants.INGREDIENT_PROGRESS_STATE.RECLAIMED_TO_BE_MANUALLY_COLLECTED:
          return val;
        default:
          return val;
      }
    }, 0);
  },
  show() {
    const self = this;
    self.node.x = 0;
  },
  hide() {
    const self = this;
    self.node.x = self.mapIns.node.width;
  },
});
