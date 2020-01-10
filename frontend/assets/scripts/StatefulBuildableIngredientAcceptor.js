cc.Class({
  extends: cc.PolygonCollider,

  init(mapIns, statefulBuildableInstance) {
    const self = this;
    self.mapIns = mapIns;
    self.statefulBuildableInstance = statefulBuildableInstance;
  },
  
  onCollisionEnter() {
    const self = this;
    if (!self.mapIns.isDraggingIngredient()) {
      return;
    }
    self.mapIns.onIngredientAcceptIn(self.statefulBuildableInstance, self);
  },

  onCollisionStay() {
    const self = this;
    if (!self.mapIns.isDraggingIngredient()) {
      return;
    }
    self.mapIns.onIngredientAcceptIn(self.statefulBuildableInstance, self);
  },

  onCollisionExit() {
    const self = this;
    if (!self.mapIns.isDraggingIngredient()) {
      return;
    }
    self.mapIns.onIngredientAcceptOut(self.statefulBuildableInstance, self);
  },

});
