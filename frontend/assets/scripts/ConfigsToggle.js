cc.Class({
  extends: cc.Toggle,
  properties: {
    activeNode: cc.Node,
    inactiveNode: cc.Node,
    defaultValue: true,
    prefix: '',
    field: '',
  },

  refresh() {
    const self = this;
    if (self.isChecked) {
      self.activeNode && (self.activeNode.active = true);
      self.inactiveNode && (self.inactiveNode.active = false);
    } else {
      self.activeNode && (self.activeNode.active = false);
      self.inactiveNode && (self.inactiveNode.active = true);
    }
  },

  init() {
    const self = this;
    self.isChecked = self.getValue();
    self.refresh();
    self._emitEvent();
  },

  toggle() {
    const self = this;
    cc.Toggle.prototype.toggle.apply(self, arguments);
    self.setValue(self.isChecked);
    self.refresh();
    self._emitEvent();
  },

  _emitEvent() {
    const self = this;
    if (self.isChecked) {
      self.onActive && self.onActive();
    } else {
      self.onInactive && self.onInactive();
    }
  },

  getValue() {
    const self = this;
    let targetObject = null;
    if (CC_EDITOR) {
      return self.isChecked;
    }
    if (!self.field) {
      return null;
    }
    if (self.prefix) {
      targetObject = JSON.parse(cc.sys.localStorage.getItem(self.prefix) || '{}');
    }
    if (null != targetObject) {
      return targetObject.hasOwnProperty(self.field) ? !!targetObject[self.field] : self.defaultValue;
    }
    let value = JSON.parse(cc.sys.localStorage.getItem(self.field));
    return null == value ? self.defaultValue : !!value;
  },

  setValue(val) {
    const self = this;
    let targetObject = null;
    if (CC_EDITOR) {
      return self.isChecked;
    }
    if (!self.field) {
      return null;
    }
    val = null == val ? self.defaultValue : !!val;
    if (self.prefix) {
      targetObject = JSON.parse(cc.sys.localStorage.getItem(self.prefix) || '{}');
    }
    if (null != targetObject) {
      targetObject[self.field] = val;
      cc.sys.localStorage.setItem(self.prefix, JSON.stringify(targetObject));
      return val;
    }
    cc.sys.localStorage.setItem(self.field, JSON.stringify(val));
    return val;
  },
})
