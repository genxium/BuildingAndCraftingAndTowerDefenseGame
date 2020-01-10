const KnapsackPanel = require('./KnapsackPanel');
const AjaxQueryResultPanel = require('./AjaxQueryResultPanel');
const PageViewCtrl = require("./PageViewCtrl");
const IngredientProgressList = require('./IngredientProgressList');
cc.Class({
  extends: KnapsackPanel,
  properties: {
    ingredientProgressList: IngredientProgressList,
    ajaxProgressList: AjaxQueryResultPanel,
    ingredientPageViewCtrl: PageViewCtrl, 
  },

  onLoad() {
    const self = this;
    KnapsackPanel.prototype.onLoad.apply(this, arguments);
    self.ajaxProgressList.setState(window.AJAX_STATE.WAITING);
    self.node.on(constants.EVENT.CELL_CLICK, self.produceIngredient, self);
    self.ajaxProgressList.beforeCallEnabled = false;
    self.ajaxProgressList.onWaiting = function() {
      self.interactable = false;
      this.waitingNode.active = true;
    };
    self.ajaxProgressList.onResponeded = function() {
      self.interactable = true;
      this.waitingNode.active = false;
    };
    self.ajaxProgressList.onFailed = function() {
      
    };
  },

  onEnable() {
    const self = this;
    KnapsackPanel.prototype.onEnable.apply(this, arguments);
  },

  onDisable() {
    const self = this;
    KnapsackPanel.prototype.onDisable.apply(this, arguments);
  },

  init(mapIns, statefulBuildableInstance) {
    const self = this;
    KnapsackPanel.prototype.init.call(self, mapIns);
    self.statefulBuildableInstance = statefulBuildableInstance;
    self.ingredientProgressList.init(mapIns, self);
    self.ingredientProgressList.onCellProduceDone = (ingredientProgressCellIns) => {
      self.queryIngredientList();
    };
    self.ingredientProgressList.onCellCancel = (ingredientProgressCellIns, ingredientProgress) => {
      ingredientProgressCellIns.cancelButton.interactable = false;
      self.mapIns.sendIngredientProgressCancelQuery({
        ingredientProgressId: ingredientProgress.id,
        autoCollect: self.statefulBuildableInstance.autoCollect,
      }, ({
        ingredientProgressList
      }) => {
        self.setData(null, ingredientProgressList);
        self.refreshIngredientProgressList();
      });

    };
    self.ingredientProgressList.onCellCollect = (ingredientProgressCellIns) => {
      ingredientProgressCellIns.collectButton.interactable = false;
      self.mapIns.sendIngredientCollectQuery({
        targetPlayerBuildableBindingId: self.statefulBuildableInstance.playerBuildableBinding.id,
      }, ({
        ingredientProgressList
      }) => {
        self.setData(null, ingredientProgressList);
        self.refreshIngredientProgressList();
      })
    };
    self.ingredientProgressList.onBoost  = (duration) => {
      self.ingredientProgressList.boostButton.interactable = false;
      self.mapIns.tryToBoostIngredientProgressList(
        self.statefulBuildableInstance, duration,
        function(
          { ingredientProgressList }
        ) {
          self.setData(null, ingredientProgressList);
          self.refreshIngredientProgressList();
          self.ingredientProgressList.boostButton.interactable = true;
        },
        function() {
          self.ingredientProgressList.boostButton.interactable = true;
        }
      );
    }
  },

  setData(ingredientList, ingredientProgressList) {
    const self = this;
    let fakeKnapsackArray = null != ingredientList ? ingredientList.map((ingredient) => {
      return {
        id: -1,
        currentCount: 1,
        ingredient,
      };
    }) : self.data;
    KnapsackPanel.prototype.setData.call(self, fakeKnapsackArray);
    self.ingredientList = ingredientList;
    self.ingredientProgressList.setData(ingredientProgressList);
  },

  refreshIngredientProgressList() {
    const self = this;
    self.ingredientProgressList.refresh();
    self.onRefresh && self.onRefresh(self.ingredientList, self.ingredientProgressList.data);
  },

  refresh() {
    const self = this;
    KnapsackPanel.prototype.refresh.call(self);
    self.ingredientPageViewCtrl.refreshIndex();
    self.refreshIngredientProgressList();
    self.refreshIngredientPageCellPriceValueLabel();
  },

  refreshIngredientPageCellPriceValueLabel() {
    const self = this;
    self.getAllIngredientPageCell().forEach(function(ingredientPageCell) {
      ingredientPageCell.priceValueLabel.node.color = self.mapIns.wallet.gold >= ingredientPageCell.ingredient.priceValue ? cc.Color.WHITE : cc.Color.RED;
    });

  },

  refreshNode() {
    const self = this;
  },

  produceIngredient(evt) {
    const self = this;
    if (self.ingredientProgressList.countQueueLength() >= constants.INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING) {
      self.mapIns.onProduceWhenReachMaxQueueLength && self.mapIns.onProduceWhenReachMaxQueueLength();
      return;
    }
    const {ingredientCell, relatedEvent} = evt.detail;
    self.mapIns.tryToProduceIngredient(self, ingredientCell);
  },

  queryIngredientList() {
    const self = this;
    self.setState(window.AJAX_STATE.WAITING);
    self.ajaxProgressList.setState(window.AJAX_STATE.WAITING);
    self.mapIns.sendIngredientListQuery(self.statefulBuildableInstance.playerBuildableBinding.id, self.statefulBuildableInstance.autoCollect, function({
      deprecatedIngredientList /* NOT used in our stage-based gameplay. -- YFLu, 2019-09-14 */,
      ingredientProgressList,
    }) {
      let stageProducibleIngredientList = self.mapIns.getProducibleIngredientList();
      self.setData(stageProducibleIngredientList, ingredientProgressList);
      self.refresh();
      self.setState(window.AJAX_STATE.SUCCEED);
      self.ajaxProgressList.setState(window.AJAX_STATE.SUCCEED);
    });
  },

  _getIngredientById(id) {
    const self = this;
    return self.data.find(x => x.ingredient.id == id).ingredient;
  },

  resizeNode() {
    const self = this;
  },

});
