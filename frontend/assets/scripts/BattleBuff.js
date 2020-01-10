function BattleBuff() {
  this.isPersistent = null; // Should be true or false.
  this.targetResourceType = null;
  this.targetResourceIdList = null;
  this.damageAddition = 0;
  this.defenderRadiusAddition = 0;
  this.movementSpeedAddition = 0;
  this.attackFpsAddition = 0;
}

window.techToBattleBuff = function(techIngredientId) {
  let toRet = new BattleBuff();
  switch (techIngredientId) {
    case 2000:
      toRet.isPersistent = true;
      toRet.targetResourceType = constants.RESOURCE_TYPE.SOLDIER_INGREDIENT_ID;
      toRet.targetResourceIdList = [1000];
      toRet.damageAddition = 20;
      return toRet;
    default:
      return null;
  }
};
