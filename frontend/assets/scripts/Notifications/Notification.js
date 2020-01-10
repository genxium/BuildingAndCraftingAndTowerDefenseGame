const Notification = {
  Type: cc.Enum({
    AUTO_DISAPPEAR: 0,
    PERSISTENT: 1,
  }),
};
cc.Class({
  extends: cc.Component,
  properties: {
    _type: {
      type: Notification.Type,
      default: Notification.Type.AUTO_DISAPPEAR,
    },
    type: {
      get() {
        return this._type;
      },
      set(val) {
        this._type = val;
        if (val == Notification.Type.PERSISTENT && null != this._scheduleCallFunc) {
          this.unschedule(this._scheduleCallFunc);
        }
      },
    },
    durationMillis: {
      type: cc.Float,
      default: 3000,
      visible: function() {
        return this.type === Notification.Type.AUTO_DISAPPEAR;
      },
    },
  },
  appear() {
    const self = this;
    
    if (null != self._scheduleCallFunc) {
      self.unschedule(self._scheduleCallFunc);
    }
    
    if (self.type == Notification.Type.AUTO_DISAPPEAR) {
      self._scheduleCallFunc = function() {
        self._scheduleCallFunc = null;
        self.disappear();
      }
      self.scheduleOnce(self._scheduleCallFunc, self.durationMillis / 1000);
    }
  },
  disappear() {
    const self = this;
    if (null != self._scheduleCallFunc) {
      self.unschedule(self._scheduleCallFunc);
      self._scheduleCallFunc = null;
    }
    let preventRemoved = self.onDisappear && self.onDisappear();
    if (true !== preventRemoved) {
      self.node.removeFromParent();
    }
  },
});

window.Notification = Notification;
