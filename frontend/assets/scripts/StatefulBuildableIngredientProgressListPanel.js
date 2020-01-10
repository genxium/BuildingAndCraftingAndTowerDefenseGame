const IngredientProgressList = require('./IngredientProgressList');
const CloseableDialog = require('./CloseableDialog');
cc.Class({
  extends: CloseableDialog,
  properties: {
    ingredientProgressList: IngredientProgressList,
  },
  init(mapIns, statefulBuildableInstance) {
    const self = this;
    self.mapIns = mapIns;
    self.statefulBuildableInstance = statefulBuildableInstance;
    self.ingredientProgressList.init(mapIns);
    self.ingredientProgressList.onCellProduceDone = () => {
      self.reQuery();
    };
    self.ingredientProgressList.onCollect = () => {
      self.collect();
    };
    self.ingredientProgressList.onCellCancel = (ingredientProgressCellIns, ingredientProgress) => {
      self.cancel(ingredientProgressCellIns, ingredientProgress);
    };
    self.ingredientProgressList.onBoost = function(duration) {
      self.boost(duration);
    };
  },

  boost(duration) {
    const self = this;
    self.ingredientProgressList.boostButton.interactable = false;
    self.mapIns.tryToBoostIngredientProgressList(
      self.statefulBuildableInstance,
      duration,
      function(
        { ingredientList, ingredientProgressList }
      ) {
        self._onBoostSucceed.apply(self, arguments);
      },
      function() {
        self._onBoostFailed.apply(self, arguments);
      }
    );
  },

  _onBoostSucceed({ ingredientList, ingredientProgressList }) {
    const self = this;
    self.setData(ingredientProgressList);
    self.refresh();
    self.ingredientProgressList.boostButton.interactable = true;
    self.onRefresh && self.onRefresh.call(self, ingredientList, ingredientProgressList);
  },

  _onBoostFailed() {
    const self = this;
    self.ingredientProgressList.boostButton.interactable = true;
  },

  setData(ingredientProgressListData) {
    const self = this;
    self.data = ingredientProgressListData;
    self.ingredientProgressList.setData(self.data);
  },

  refresh() {
    const self = this;
    self.ingredientProgressList.refresh();
  },

  reQuery() {
    const self = this;
    self.mapIns.sendIngredientListQuery(
      self.statefulBuildableInstance.playerBuildableBinding.id,
      self.statefulBuildableInstance.autoCollect,
      function({
        ingredientList, ingredientProgressList
      }) {
        self.setData(ingredientProgressList);
        self.refresh();
        self.onRefresh && self.onRefresh.call(self, ingredientList, ingredientProgressList);
      }
    );
  },

  collect() {
    const self = this;
    self.ingredientProgressList.collectButton.interactable = false;
    self.mapIns.sendIngredientCollectQuery(
      {
        targetPlayerBuildableBindingId: self.statefulBuildableInstance.playerBuildableBinding.id,
      },
      function({
        ingredientList, ingredientProgressList
      }) {
        self.ingredientProgressList.collectButton.interactable = true;
        self.setData(ingredientProgressList);
        self.refresh();
        self.onRefresh && self.onRefresh.call(self, ingredientList, ingredientProgressList);
      }
    ); 
  },

  cancel(ingredientProgressCellIns, ingredientProgress) {
    const self = this;
    ingredientProgressCellIns.cancelButton.interactable = false;
    self.mapIns.sendIngredientProgressCancelQuery(
      {
        ingredientProgressId: ingredientProgress.id,
        autoCollect: ingredientProgressCellIns.isAutoCollect() ? 1 : 0,
      },
      function({
        ingredientList, ingredientProgressList
      }) {
        self.setData(ingredientProgressList);
        self.refresh();
        self.onRefresh && self.onRefresh.call(self, ingredientList, ingredientProgressList);
      }
    );
  },

});
