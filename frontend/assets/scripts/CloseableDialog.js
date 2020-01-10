const INFINITE_COORDINATE = -9999;
cc.Class({
  extends: cc.Component,

  properties: {
    closeBtn: {
      type: cc.Button,
      default: null,
    },
    onCloseDelegate: {
      type: cc.Object,
      default: null,
    },
    defaultActionsEnabled: {
      default: true,
    },
    fixed: {
      default: false
    },
    alignSelfOnLoad: true,
    closeSelfOnBlur: true,
    doNotRemove: false,
    withMask: false,
  },

  ctor() {
    this.mapIns = null;
  },

  onEnable() {
    const self = this;
    if (self.defaultActionsEnabled) {
      self.node.setScale(0.3);
      const scalingSeq = cc.sequence(
        cc.scaleTo(0.2, 1.2),
        cc.scaleTo(0.2, 1.0),
      );
      const spawn = cc.spawn(cc.fadeIn(0.2), scalingSeq);
      self.node.runAction(cc.sequence(
        spawn, cc.callFunc(function() {
          self.onShowed && self.onShowed();
        })
      ));
    } else {
      self.onShowed && self.onShowed();
    }
    window.enabledDialogs.push(self);
  },

  onDisable() {
    // Deliberately left blank.
    const self = this;
    let index = window.enabledDialogs.indexOf(self);
    if (index != -1) {
      window.enabledDialogs.splice(index, 1);
    }
  },

  onLoad() {
    const theCloseBtnOnClickHandler = new cc.Component.EventHandler();
    theCloseBtnOnClickHandler.target = this.node;
    theCloseBtnOnClickHandler.component = "CloseableDialog";
    theCloseBtnOnClickHandler.handler = "onCloseClicked";
    theCloseBtnOnClickHandler.customEventData = null;
    this.closeBtn.clickEvents = [
      theCloseBtnOnClickHandler
    ];

    if (this.alignSelfOnLoad) {
      let widgetsCpn = this.node.getComponent(cc.Widget);
      if (null != widgetsCpn) {
        widgetsCpn.updateAlignment();
        widgetsCpn.enabled = false;
      }
    }
  },

  onDestroy() {

  },

  disableCloseButtonOnce() {
    // WARNING: This method should be used only exclusively by "NarrativeScene" and its closely relevant classes.
    this.closeBtn.node.active = false;
  },

  show() {
    const self = this;
    self.node.x = 0;
    if (self.doNotRemove && null != self.node.parent) {
      self.onEnable && self.onEnable.apply(self);
    }
  },

  hide() {
    const self = this;
    self.node.x = INFINITE_COORDINATE;
    if (self.doNotRemove && null != self.node.parent) {
      self.onDisable && self.onDisable.apply(self);
    }
  },

	isHidden() {
	  const self = this;
		if (null == self.node.parent) {
		  return true;
		}
		if (self.doNotRemove) {
			return !self.node.active || self.node.x == INFINITE_COORDINATE;
	  } else {
		  return !self.node.active;
		}
	},

  _closeWithoutDefaultAction() {
    if (!this.doNotRemove) {
      if (null != this.node.parent) {
        this.node.parent.removeChild(this.node);
      } 
    } else {
      cc.log(this.node.name, 'is doNotRemove, thus dialog close without removeFromParent');
    }
    
    if (false == this.closeBtn.node.active) {
      this.closeBtn.node.active = true;
    }
    if (!this.onCloseDelegate) return;
    this.onCloseDelegate();
  },

  onCloseClicked(evt, customData) {
    const self = this;
    if (null != evt) {
      evt.stopPropagation();
      if (null != self.mapIns) {
        self.mapIns.playEffectCommonButtonClick();
      }
    }
    if (this.defaultActionsEnabled) {
      cc.log(`CloseableDialog.onCloseClicked called with defaultActionsEnabled.`);
      const animDurationSeconds = 0.2;
      const spawn = cc.spawn(
        cc.fadeOut(animDurationSeconds), 
        cc.scaleTo(animDurationSeconds, 0.1)
      );
      this.node.runAction(spawn);
      // WARNING: The following `setTimeout` is used deliberately to avoid a case where `cc.callFunc` at the end of a `cc.sequence` is NOT called!
      setTimeout(() => {
        if(self.node){
          self.node.setScale(1);
        }
        self._closeWithoutDefaultAction();
      }, animDurationSeconds*1000);
    } else {
      cc.log(`CloseableDialog.onCloseClicked called without defaultActionsEnabled.`);
      this._closeWithoutDefaultAction();
    }
  },
});
