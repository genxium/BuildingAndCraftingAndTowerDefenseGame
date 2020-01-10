const CloseableDialog = require('./CloseableDialog');
const ConfigsToggle = require('./ConfigsToggle');
const i18n = require('LanguageData');

cc.Class({
  extends: CloseableDialog,  

  properties: {
    volumeToggle: {
      type: ConfigsToggle,
      default: null,
    },
    volumeSlider: {
      type: cc.Slider,
      default: null,
    },
    logoutButton: {
      type: cc.Button,
      default: null,
    },
  },

  onLoad() {
    CloseableDialog.prototype.onLoad.call(this);

    if (null == window.tt) {
      this.logoutButton.node.active = true;      
    }
  },
  
  init(mapIns) {
    const self = this;
    self.mapIns = mapIns;
    
    // Initialization of Volumn Toggle [begins].
    self.volumeToggle.onActive = function() {
      self.mapIns.onVolumeActive && self.mapIns.onVolumeActive();
    };
    self.volumeToggle.onInactive = function() {
      self.mapIns.onVolumeInactive && self.mapIns.onVolumeInactive();
    };
    if (self.volumeToggle.node.active) {
      self.volumeToggle.init();
    }
    self.mapIns.volumeToggle = self.volumeToggle;
    // Initialization of Volumn Toggle [ends].

  },

  onLogoutButtonClicked(evt) {
    if (null == this.mapIns) return;
    this.mapIns.onLogoutTriggerClicked(evt);
  },

  onVolumeSliderTuned(evt, customEventData) {
    const self = this;
    self.mapIns.onVolumeSliderTuned(evt, customEventData);
  },
});
