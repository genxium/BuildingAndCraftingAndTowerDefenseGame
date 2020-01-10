const CloseableDialog = require('./CloseableDialog');
window.AJAX_STATE = {
  WAITING: 0,
  SUCCEED: 1 << 0,
  FAILED: 1 << 1,
  RESPONEDED: 1 << 2,
};

cc.Class({
  extends: CloseableDialog,

  properties: {
    waitingNode: cc.Node,
    querySucceedNode: cc.Node,
    queryFailedNode: cc.Node,
    beforeCallEnabled: true,
  },

  onLoad() {
    const self = this;
    CloseableDialog.prototype.onLoad.apply(self, arguments);
    self.state = window.AJAX_STATE.WAITING;
  },

  setData(ctx, argv) {
    const self = this;
    self.ctx = ctx || self;
    self.argv = argv || [];
  },

  setState(state) {
    const self = this;
    switch (state) {
      case window.AJAX_STATE.WAITING:
        self.state = state;
        break;
      case window.AJAX_STATE.SUCCEED:
      case window.AJAX_STATE.FAILED:
        self.state = state;
        self.state |= window.AJAX_STATE.RESPONEDED;
        break;
      default:
        self.state = -1;
        cc.warn(`unknown ajax state`)
        return false;
    }
    if (self.isWaiting()) {
      self.emit('Waiting');
    } else if (self.isSucceed()) {
      self.emit('Responeded');
      self.emit('Succeed');
    } else if (self.isFailed()) {
      self.emit('Responeded');
      self.emit('Failed');
    }
    return true;
  },

  isWaiting() {
    return this.state == window.AJAX_STATE.WAITING;
  },

  isSucceed() {
    return (this.state & window.AJAX_STATE.RESPONEDED) && (this.state & window.AJAX_STATE.SUCCEED);
  },
  
  isFailed() {
    return (this.state & window.AJAX_STATE.RESPONEDED) && (this.state & window.AJAX_STATE.FAILED);
  },

  emit(cbName) {
    const self = this, handleFn = self[`on${cbName}`];
    if (typeof handleFn === 'function') {
      if (self.beforeCallEnabled) {
        let beforeCallFn = self[`before${cbName}`];
        beforeCallFn && beforeCallFn.apply(self.ctx || self, self.argv || []);
      }
      handleFn.apply(self.ctx || self, self.argv || []);
    }
  },

  beforeWaiting() {
    const self = this;
    self.waitingNode && (self.waitingNode.active = true);
    self.querySucceedNode && (self.querySucceedNode.active = false);
    self.queryFailedNode && (self.queryFailedNode.active = false);
  },
  
  beforeSucceed() {
    const self = this;
    self.waitingNode && (self.waitingNode.active = false);
    self.querySucceedNode && (self.querySucceedNode.active = true);
    self.queryFailedNode && (self.queryFailedNode.active = false);
  },

  beforeFailed() {
    const self = this;
    self.waitingNode && (self.waitingNode.active = false);
    self.querySucceedNode && (self.querySucceedNode.active = false);
    self.queryFailedNode && (self.queryFailedNode.active = true);
  },

  beforeResponeded() {
    
  },

  onResponeded() {},

  onSucceed() {},

  onFailed() {},

  onWaiting() {},


});
