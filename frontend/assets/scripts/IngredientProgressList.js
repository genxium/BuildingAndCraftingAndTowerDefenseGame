const ProgressNum = require('./ProgressNum');
cc.Class({
  extends: cc.Component,

  properties: {
    content: cc.Node,
    ingredientProgressCellPrefab: cc.Prefab,
    collectButton: cc.Button,
    boostButton: cc.Button,
    elapsedTimeProgress: ProgressNum,
    queueLabel: cc.Label,
    tipNodeOnEmpty: cc.Node,
  },

  onLoad() {
    const self = this;
    const collectHandler = new cc.Component.EventHandler();
    collectHandler.target = self.node;
    collectHandler.component = 'IngredientProgressList';
    collectHandler.handler = 'onCollectButtonClicked';
    self.collectButton.clickEvents = [
      collectHandler
    ];

    const boostHandler = new cc.Component.EventHandler();
    boostHandler.target = self.node;
    boostHandler.component = 'IngredientProgressList';
    boostHandler.handler = 'onBoostButtonClicked';
    self.boostButton.clickEvents = [
      boostHandler
    ];
  },

  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
    self.boostButton.node.active &= mapIns.boostEnabled;
  },

  setData(ingredientProgressList) {
    const self = this;
    self.data = ingredientProgressList.sort(function(ingredientProgressList1, ingredientProgressList2) {
      let val1 = 0, val2 = 0;
      switch (ingredientProgressList1.state) {
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED:
      val1 = 2;
      break;
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.RECLAIMING_TO_BE_MANUALLY_COLLECTED:
      val1 = 1;
      break;
      case constants.INGREDIENT_PROGRESS_STATE.COMPLETED_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.RECLAIMED_TO_BE_MANUALLY_COLLECTED:
      val1 = 0;
      break;
      }
      switch (ingredientProgressList2.state) {
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED:
      val2 = 2;
      break;
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.PRODUCING_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.RECLAIMING_TO_BE_MANUALLY_COLLECTED:
      val2 = 1;
      break;
      case constants.INGREDIENT_PROGRESS_STATE.COMPLETED_TO_BE_MANUALLY_COLLECTED:
      case constants.INGREDIENT_PROGRESS_STATE.RECLAIMED_TO_BE_MANUALLY_COLLECTED:
      val2 = 0;
      break;
      }
      return val1 - val2;
    });
    self.elapsedTimeProgress.isForElapsedTimeProgress = true;
  },

  refresh() {
    const self = this;
    let disappeardNodes = [], reservedNodesMap = {};
    self.content.children.forEach(
      (ingredientProgressCellNode) => {
        let ingredientProgressCellIns = ingredientProgressCellNode.getComponent("IngredientProgressCell");
        let ingredientProgress = self.data.find(x => x.id == ingredientProgressCellIns.ingredientProgress.id);
        if (null == ingredientProgress) {
          // The ingredientProgress for target node is done.
          disappeardNodes.push(ingredientProgressCellNode);
        } else {
          // Should refresh the target node.
          reservedNodesMap[ingredientProgress.id] = ingredientProgressCellNode;
        }
      }
    );
    disappeardNodes.forEach(function(node) {
      self.content.removeChild(node);
    });
    self.data.forEach((ingredientProgress) => {
      let ingredientProgressCellNode = reservedNodesMap[ingredientProgress.id] || cc.instantiate(self.ingredientProgressCellPrefab);
      let ingredientProgressCellIns = ingredientProgressCellNode.getComponent("IngredientProgressCell");
      ingredientProgressCellIns.init(self.mapIns);
      ingredientProgressCellIns.setData(ingredientProgress);
      ingredientProgressCellIns.collectButton.interactable = false;
      ingredientProgressCellIns.onProduceDone = () => {
        self.onCellProduceDone && self.onCellProduceDone(ingredientProgressCellIns);
        self.refreshElapsedTimeProgress();
      };
      ingredientProgressCellIns.onCollect = () => {
        self.onCellCollect && self.onCellCollect(ingredientProgressCellIns);
      };
      ingredientProgressCellIns.onCancel = (ingredientProgress) => {
        self.onCellCancel && self.onCellCancel(ingredientProgressCellIns, ingredientProgress);
      };
      safelyAddChild(self.content, ingredientProgressCellNode);
      ingredientProgressCellIns.refresh();
    });
    self.queueLabel.string = i18nExtend.render('StatefulBuildableIngredientProgressListPanel.queueLabel', {
      current: self.countQueueLength(),
      max: constants.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING,
    });
    // determine whether to show tipNodeOnEmpty.
    if (!self.data.length) {
      if (null == self.tipNodeOnEmpty) {
        console.warn(`There no tip here for empty ingredientProgressList.`)
      } else {
        self.tipNodeOnEmpty.active = true;
      }
    } else {
      if (self.tipNodeOnEmpty) {
        self.tipNodeOnEmpty.active = false;
      }
    }

    self.refreshElapsedTimeProgress();
  },

  refreshElapsedTimeProgress() {
    const self = this;
    const restDuration = self.countRestDuration();
    if (restDuration > 0) {
      self.elapsedTimeProgress.node.active = true;
      self.elapsedTimeProgress.setData(null, restDuration, Date.now());
      self.boostButton.node.active = mapIns.boostEnabled;
    } else {
      self.elapsedTimeProgress.node.active = false;
      self.boostButton.node.active = false;
    }
  },

  getIngredientProgressCells() {
    const self = this;
    return self.content.children.map(node => node.getComponent('IngredientProgressCell'));
  },

  countRestDuration() {
    const self = this;
    if (!self.data || !self.data.length) {
      return 0;
    }
    return self.getIngredientProgressCells().reduce(function(val, ingredientProgressCellIns) {
      return val + ingredientProgressCellIns.countRestDuration();
    }, 0);
  },

  onCollectButtonClicked(evt) {
    const self = this;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    if (self.getIngredientProgressCells().filter((ingredientProgressCellIns) => {
      return ingredientProgressCellIns.isCouldCollected();
    }).length == 0) {
      return;
    }
    self.onCollect && self.onCollect();
  },

  countQueueLength() {
    const self = this;
    return self.data.length;
  },

  onBoostButtonClicked(evt) {
    const self = this;
    if (null != self.mapIns && null != evt) {
      self.mapIns.playEffectCommonButtonClick();
    }
    let duration = self.countRestDuration();
    if (duration <= 0) {
      return;
    }
    self.onBoost && self.onBoost(duration);
  },

})
