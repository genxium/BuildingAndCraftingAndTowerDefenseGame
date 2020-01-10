const Notification = require('./Notification.js');
cc.Class({
  extends: Notification,
  properties: {
    label: cc.Label,
    sign: cc.Label,
  },
  setTip(description) {
    const self = this;
    self.label.string = description;
  },
  setColor(c) {
    this.label.node.color = c;
    this.sign.node.color = c;
  },
})
