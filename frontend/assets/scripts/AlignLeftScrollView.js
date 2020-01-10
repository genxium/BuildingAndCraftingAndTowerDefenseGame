cc.Class({
    extends: cc.ScrollView,

    properties: {
      contentAlignCenterIfNotOverflow: true,
      alignOnce: true,
    },

    ctor() {
      this._aligned = false;
    },

    onEnable() {
      cc.ScrollView.prototype.onEnable.apply(this, arguments);
      const self = this;
      if (null != self.content) {
        let layout = self.content.getComponent(cc.Layout);
        if (null != layout) {
          layout.updateLayout();
        }
      }
      let shouldAligned = self.alignOnce ? !self._aligned : true;
      if (self.content.width > self.node.width && shouldAligned) {
        self._aligned = true;
        self.scrollToLeft();
      }
      if (self.content.width <= self.node.width && self.contentAlignCenterIfNotOverflow) {
        self.node.opacity = 0;
        self.scheduleOnce(function() {
          self.content.x = 0;
          self.node.opacity = 255;
        })
      }
    },

});
