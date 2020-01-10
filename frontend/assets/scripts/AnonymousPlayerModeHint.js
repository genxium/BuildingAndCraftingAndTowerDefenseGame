const i18n = require('LanguageData');
const CloseableDialog = require("./CloseableDialog");

cc.Class({
  extends: CloseableDialog,

  properties: {
    title: {
      type: cc.Label,
      default: null,
    },
    hint: {
      type: cc.Label,
      default: null,
    },
    yesButton: {
      type: cc.Button,
      default: null,
    },
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);
  },

  updateBindData(gameCenterLoginNode) {
    const yesButtonOnClickHandler = new cc.Component.EventHandler();
    yesButtonOnClickHandler.target = gameCenterLoginNode;
    yesButtonOnClickHandler.component = "GameCenterLogin";
    yesButtonOnClickHandler.handler = "useAnonymousLogin"
    this.yesButton.clickEvents = [yesButtonOnClickHandler]; 
  },

});
