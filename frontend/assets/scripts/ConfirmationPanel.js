const CloseableDialog = require('./CloseableDialog');

cc.Class({
  extends: CloseableDialog,
  properties: {
    titleLabel: cc.Label,
    hintLabel: cc.Label,
    hintRichText: {
      type: cc.RichText,
      default: null
    },
    confirmBtn: cc.Button,
    cancelBtn: cc.Button,
    autoClose: {
      tooltip: "The dialog will close automatically when confirmed/caneled",
      default: true,
    }
  },
  onLoad() {
    const self = this;
    CloseableDialog.prototype.onLoad && CloseableDialog.prototype.onLoad.call(self);
    const confirmHander = new cc.Component.EventHandler();
    confirmHander.target = self;
    confirmHander.component = self.node.name;
    confirmHander.handler = "onConfirmButtonClicked";
    self.confirmBtn.clickEvents = [
      confirmHander
    ];

    const cancelHander = new cc.Component.EventHandler();
    cancelHander.target = self;
    cancelHander.component = self.node.name;
    cancelHander.handler = "onCancelButtonClicked";
    self.cancelBtn.clickEvents = [
      cancelHander
    ];

    self._isConfirmed = null;
  },
  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
  },
  setHintLabel(str) {
    if (null == this.hintLabel || str == null) {
      return;
    }
    this.hintLabel.string = str;
    if (null != this.hintRichText) {
      this.hintRichText.string = "";
    }
  },
  setHintRichText(str) {
    if (null == this.hintRichText || str == null) {
      return;
    }
    this.hintRichText.string = str;
    if (null != this.hintLabel) {
      this.hintLabel.string = "";
    }
  },
  onConfirmButtonClicked(evt) {
    const self = this;
    self._isConfirmed = true;
    self.onConfirm && self.onConfirm();
    if (self.autoClose) {
      self.onCloseClicked(evt);
    }
  },
  onCancelButtonClicked(evt) {
    const self = this;
    self._isConfirmed = false;
    self.onCancel && self.onCancel();
    if (self.autoClose) {
      self.onCloseClicked(evt);
    }
  },
  isConfirmed() {
    const self = this;
    if (null == self._isConfirmed) {
      return false;
    }
    return self._isConfirmed;
  },
  isCanceled() {
    const self = this;
    if (null == self._isConfirmed) {
      return false;
    }
    return self._isConfirmed;
  },
  setTitleLabel(str) {
    const self = this;
    if (null == self.titleLabel) {
      console.warn('setTitleLabel called when titleLabel is null');
      return;
    }
    self.titleLabel.string = str;
    // cover default string.
    let localizedLabel = self.titleLabel.node.getComponent('LocalizedLabel');
    if (null != localizedLabel) {
      self.titleLabel.node.removeComponent('LocalizedLabel');
    }
  },
});

