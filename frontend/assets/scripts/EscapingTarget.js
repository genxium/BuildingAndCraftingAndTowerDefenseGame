cc.Class({
  extends: cc.Component,
  properties: {
    forEnemyNode: {
      type: cc.Node,
      default: null,
    },
    forAllyNode: {
      type: cc.Node,
      default: null,
    },
  },

  setForEnemy() {
    this.forAllyNode.active = false;
    this.forEnemyNode.active = true;
  },

  setForAlly() {
    this.forEnemyNode.active = false;
    this.forAllyNode.active = true;
  },
});
