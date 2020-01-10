cc.Class({
  extends: cc.Label,

  properties: {
  },

  onLoad() {
    const labelComp = this.node.getComponent(cc.Label);
    labelComp.overflow = cc.Label.Overflow.RESIZE_HEIGHT;
    labelComp.verticalAlign = cc.Label.VerticalAlign.CENTER;
    labelComp.horizontalAlign= cc.Label.HorizontalAlign.LEFT;
    /** TODO: 其他需要统一的样式 **/
   
  },

});
