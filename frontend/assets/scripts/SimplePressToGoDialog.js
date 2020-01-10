const CloseableDialog = require('./CloseableDialog');

cc.Class({
  extends: CloseableDialog,
  properties: {
    titleLabel: {
      type: cc.Label,
      default: null,
    },
    hintLabel: {
      type: cc.Label,
      default: null
    },
    hintRichText: {
      type: cc.RichText,
      default: null
    },
    yesButtonLabel: {
      type: cc.Label,
      default: null
    },
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
  },
  
  setTitleLabel(str) {
    const self = this;
    self.titleLabel.string = str;
    // cover default string.
    let localizedLabel = self.titleLabel.node.getComponent('LocalizedLabel');
    if (null != localizedLabel) {
      self.titleLabel.node.removeComponent('LocalizedLabel');
    }
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

  setYesButtonLabel(str) {
    const self = this;
    this.yesButtonLabel.string = str;
    // cover default string.
    let localizedLabel = self.yesButtonLabel.node.getComponent('LocalizedLabel');
    if (null != localizedLabel) {
      self.yesButtonLabel.node.removeComponent('LocalizedLabel');
    }
  },

});
