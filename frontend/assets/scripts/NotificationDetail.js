const CloseableDialog = require('./CloseableDialog');
cc.Class({
    extends: CloseableDialog,

    properties: {
      descriptionLabel: {
        type: cc.Label, 
        default: null
      },
    },

    setData(content) {
      this.descriptionLabel.string = content;
    },

    onLoad() {
      CloseableDialog.prototype.onLoad.call(this);
    },

    start () {

    },

});
