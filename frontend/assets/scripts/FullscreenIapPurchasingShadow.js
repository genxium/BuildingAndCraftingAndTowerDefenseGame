module.exports = cc.Class({
  extends: cc.Component,

  properties: {
    maskLayer: {
      type: cc.Node,
      default: null
    },
    cancelButton: {
      type: cc.Button,
      default: null
    },
    rotatingNode: {
       type: cc.Node,
        default: null
      },
  },

  // LIFE-CYCLE CALLBACKS:
  onLoad() {
  },

  onEnable() {
    this.action = this.rotatingNode.runAction(
      cc.repeatForever(cc.rotateBy(10.0, 360))
    );
  }
});

