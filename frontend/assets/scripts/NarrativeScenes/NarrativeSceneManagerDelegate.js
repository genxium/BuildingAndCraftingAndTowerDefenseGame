const i18n = require('LanguageData');

window.ALL_MAP_STATES = {
  VISUAL: (1 << 0), // For free dragging & zooming.
  POSITIONING_NEW_STATEFUL_BUILDABLE_INSTANCE: (1 << 1),
  SHOWING_MODAL_POPUP: (1 << 2),
  IN_NARRATIVE_SCENE: (1 << 3),
  EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE: (1 << 4),
  IN_IAP_WAITING: (1 << 5),
  /*
   * When in DRAGGING_INGREDIENT state, the following state are excluded:
   * POSITIONING_NEW_STATEFUL_BUILDABLE_INSTANCE, EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE, SHOWING_MODAL_POPUP, FLOATING_MODAL_POPUP
   */
  DRAGGING_INGREDIENT: (1 << 6),
  /*
   * When in FLOATING_MODAL_POPUP, the following state are exclueded:
   * POSITIONING_NEW_STATEFUL_BUILDABLE_INSTANCE, EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE, DRAGGING_INGREDIENT
   */
  FLOATING_MODAL_POPUP: (1 << 7),
  /*
   * When IN_COMBO, the following state are exclueded:
   * EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE
   */
  IN_COMBO: (1 << 8),
  IN_SCOUTING: (1 << 9),
};

module.export = cc.Class({
  extends: cc.Component,

  properties: {
    commonButtonClickAudioClip: {
      type: cc.AudioClip,
      default: null,
    },
    isUsingTouchEventManager: {
      default: true, 
    },
    canvasNode: {
      type: cc.Node,
      default: null, 
    },
    widgetsAboveAllPrefab: {
      type: cc.Prefab,
      default: null, 
    },
    isUsingJoystick: {
      default: false,
    },
    addToMainCamera: {
      default: true,
    },
  },

  addStateBit(thatBit) {
    if (0 == (this.state & thatBit)) {
      this.state |= thatBit;
      return true;
    }
    return false;
  },

  removeStateBit(thatBit) {
    if (0 < (this.state & thatBit)) {
      this.state &= ~thatBit;
      return true;
    }
    return false;
  },

  havingStateBit(thatBit) {
    return (0 < (this.state & thatBit));
  },

  addInIapWaiting() {
    return this.addStateBit(ALL_MAP_STATES.IN_IAP_WAITING);
  },

  removeInIapWaiting() {
    return this.removeStateBit(ALL_MAP_STATES.IN_IAP_WAITING);
  },

  isInIapWaiting() {
    return this.havingStateBit(ALL_MAP_STATES.IN_IAP_WAITING);
  },

  addInNarrative() {
    return this.addStateBit(ALL_MAP_STATES.IN_NARRATIVE_SCENE);
  },

  removeInNarrative() {
    return this.removeStateBit(ALL_MAP_STATES.IN_NARRATIVE_SCENE);
  },

  isInNarrativeScene() {
    return this.havingStateBit(ALL_MAP_STATES.IN_NARRATIVE_SCENE);
  },

  addPositioningNewStatefulBuildableInstance() {
    return this.addStateBit(ALL_MAP_STATES.POSITIONING_NEW_STATEFUL_BUILDABLE_INSTANCE);
  },

  removePositioningNewStatefulBuildableInstance() {
    return this.removeStateBit(ALL_MAP_STATES.POSITIONING_NEW_STATEFUL_BUILDABLE_INSTANCE);
  },

  isPositioningNewStatefulBuildableInstance() {
    return this.havingStateBit(ALL_MAP_STATES.POSITIONING_NEW_STATEFUL_BUILDABLE_INSTANCE);
  },

  addEditingExistingStatefulBuildableInstance() {
    return this.addStateBit(ALL_MAP_STATES.EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE);
  },

  removeEditingExistingStatefulBuildableInstance() {
    return this.removeStateBit(ALL_MAP_STATES.EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE);
  },

  isEditingExistingStatefulBuildableInstance() {
    return this.havingStateBit(ALL_MAP_STATES.EDITING_EXISTING_STATEFUL_BUILDABLE_INSTANCE);
  },

  addShowingModalPopup() {
    return this.addStateBit(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
  },
  
  removeShowingModalPopup() {
    return this.removeStateBit(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
  },

  isShowingModalPopup() {
    return this.havingStateBit(ALL_MAP_STATES.SHOWING_MODAL_POPUP);
  },

  addDraggingIngredient() {
    return this.addStateBit(ALL_MAP_STATES.DRAGGING_INGREDIENT);
  },

  removeDraggingIngredient() {
    return this.removeStateBit(ALL_MAP_STATES.DRAGGING_INGREDIENT);
  },

  isDraggingIngredient() {
    return this.havingStateBit(ALL_MAP_STATES.DRAGGING_INGREDIENT);
  },

  addFloatingModalPopup() {
    return this.addStateBit(ALL_MAP_STATES.FLOATING_MODAL_POPUP);
  },

  removeFloatingModalPopup() {
    return this.removeStateBit(ALL_MAP_STATES.FLOATING_MODAL_POPUP);
  },

  isFloatingModalPopup() {
    return this.havingStateBit(ALL_MAP_STATES.FLOATING_MODAL_POPUP);
  },

  addInCombo() {
    return this.addStateBit(ALL_MAP_STATES.IN_COMBO);
  },

  removeInCombo() {
    return this.removeStateBit(ALL_MAP_STATES.IN_COMBO);
  },

  isInCombo() {
    return this.havingStateBit(ALL_MAP_STATES.IN_COMBO);
  },

  addInScouting() {
    return this.addStateBit(ALL_MAP_STATES.IN_SCOUTING);
  },

  removeInScouting() {
    return this.removeStateBit(ALL_MAP_STATES.IN_SCOUTING);
  },

  isInScouting() {
    return this.havingStateBit(ALL_MAP_STATES.IN_SCOUTING);
  },

  isPurelyVisual() {
    return (0 < (this.state & ALL_MAP_STATES.VISUAL)) && (0 == (this.state & ~ALL_MAP_STATES.VISUAL));
  }, 

  ctor() {
    this.gameSettings = {
      volumePercentage: 0.5,
      volumeToggle: true,
    };
  },

  onLoad() {
    const self = this;
    self.state = ALL_MAP_STATES.VISUAL;
    const attachedToNode = self.node;
    self.narrativeSceneManager = attachedToNode.getComponent("NarrativeSceneManager");
    if (null == self.narrativeSceneManager) {
      cc.warn("You should attach a `NarrativeSceneManager` to the node of a `NarrativeSceneManagerDelegate`!");
    }
    self.currentTutorialStage = 0;
    self.currentTutorialGroupIndex = 0;
    self.interruptTutorialMask = {
      visitedGroups: {}
    };

    const canvasNode = self.canvasNode;
    self.mainCameraNode = canvasNode.getChildByName("Main Camera");
    self.mainCamera = self.mainCameraNode.getComponent(cc.Camera);


    // Initialization of the "widgetsAboveAllNode" [begins].
    self.widgetsAboveAllNode = cc.instantiate(self.widgetsAboveAllPrefab);
    self.widgetsAboveAllNode.width = canvasNode.width;
    self.widgetsAboveAllNode.height = canvasNode.height;
    self.widgetsAboveAllNode.setScale(1 / self.mainCamera.zoomRatio);
    setLocalZOrder(self.mainCameraNode, window.CORE_LAYER_Z_INDEX.INFINITY);

    if (self.addToMainCamera) {
      safelyAddChild(self.mainCameraNode, self.widgetsAboveAllNode);
    }


    self.widgetsAboveAllScriptIns = self.widgetsAboveAllNode.getComponent(self.widgetsAboveAllNode.name);

    self.widgetsAboveAllScriptIns.init(self, attachedToNode, canvasNode, self.isUsingJoystick, self.isUsingTouchEventManager);
    for (let prefab of self.widgetsAboveAllScriptIns.prefabs) {
      if (null == prefab) {
        continue;
      }
      const firstChStr = prefab.name.substring(0, 1);
      const remainingNameStr = prefab.name.substring(1, prefab.name.length);
      const prefabFieldName = firstChStr.toLowerCase() + remainingNameStr + "Prefab";
      self[prefabFieldName] = prefab; // Dynamically adding properties.
    }
    // Initialization of the "widgetsAboveAllNode" [ends].

    for (let child of self.mainCameraNode.children) {
      child.setScale(1 / self.mainCamera.zoomRatio);
    }

    //Initialization of the viewingPanelManager [begins].
    self.viewingPanelManager = [];
    self.viewingPanelManager.hasPanel = function(nodeName) {
      return !!this.find(x => x.node.name == nodeName);
    };
    //Initialization of the viewingPanelManager [ends].

    self.loadingTip = self.widgetsAboveAllScriptIns.loadingTip;

    // Loads `gameSettings`, and starts playing BGM if applicable. [begins]
    const savedGameSettingsStr = cc.sys.localStorage.getItem("gameSettings");
    if (null != savedGameSettingsStr && 0 < savedGameSettingsStr.length) {
      const savedGameSettings = JSON.parse(savedGameSettingsStr);
      self.gameSettings = Object.assign(self.gameSettings, savedGameSettings);
    }

    self.gameSettingsPanelNode = cc.instantiate(self.gameSettingsPanelPrefab);
    self.gameSettingsPanelNode.setPosition(cc.v2(0, 0));
    self.gameSettingsPanelScriptIns = self.gameSettingsPanelNode.getComponent("GameSettingsPanel");
    self.gameSettingsPanelScriptIns.init(self);

      
    if (null == self.gameSettings.volumeToggle) {
      self.gameSettings.volumeToggle = true;
    }

    if (null == self.gameSettings.volumePercentage) {
      self.gameSettings.volumePercentage = 0.5;
    }

    self.gameSettingsPanelScriptIns.volumeSlider.progress = self.gameSettings.volumePercentage;
    self.volumeToggle.active = self.gameSettings.volumeToggle;
    if (self.volumeToggle.active) {
      // The assignment above alone might miss to trigger the following function when "true == self.gameSettings.volumeToggle".
      self.onVolumeActive();
    }
    self.gameSettingsUpdateInterval = setInterval(function() {
      if (null != self.gameSettings && Object.keys(self.gameSettings).length > 0) {
        // Ever initialized.
        cc.sys.localStorage.setItem("gameSettings", JSON.stringify(self.gameSettings));
      }
    }, 5000);
    // Loads `gameSettings`, and starts playing BGM if applicable. [ends]

    // Initialization of `gameSettingsButton` [begin].
    const gameSettingsButtonHanlder  = new cc.Component.EventHandler();
    gameSettingsButtonHanlder.target = self.node;
    gameSettingsButtonHanlder.component = self.node.name;
    gameSettingsButtonHanlder.handler = "onGameSettingsTriggerClicked";
    this.gameSettingsButton.clickEvents = [
      gameSettingsButtonHanlder
    ];
    // Initialization of `gameSettingsButton` [end].
  },
    
  onDestroy() {
    const self = this;
    if (null != self.gameSettingsUpdateInterval) {
      clearInterval(self.gameSettingsUpdateInterval);
      self.gameSettingsUpdateInterval = null;
    }
  },

  showSimpleConfirmationPanel(hintLabel, confirmCallback, cancelCallback, closeCallback) {
    const self = this;
    const confirmationPanelNode = cc.instantiate(self.confirmationPanelPrefab);
    const confirmationPanelIns = confirmationPanelNode.getComponent('ConfirmationPanel');
    confirmationPanelIns.init(self);
    confirmationPanelIns.setHintLabel(hintLabel);
    confirmationPanelIns.onCloseDelegate = function() {
      self.exitPanelView(confirmationPanelIns);
      closeCallback && closeCallback();
    };
    confirmationPanelIns.onConfirm = confirmCallback;
    confirmationPanelIns.onCancel = cancelCallback;
    self.enterPanelView(confirmationPanelIns);
    return confirmationPanelIns;
  },

  onLogoutTriggerClicked(evt) {
    const self = this;
    self.showSimpleConfirmationPanel(i18n.t('ConfirmationPanel.Tip.logout'), function() {
      self.clearPanels();
      self.logout();
    });
  },

  logout() {
    const self = this;
    const selfPlayerStr = cc.sys.localStorage.getItem("selfPlayer");
    if (null != selfPlayerStr) {
      const selfPlayer = JSON.parse(selfPlayerStr);
      const requestContent = {
        intAuthToken: selfPlayer.intAuthToken
      };
      try {
        NetworkUtils.ajax({
          url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.INT_AUTH_TOKEN + constants.ROUTE_PATH.LOGOUT,
          type: "POST",
          data: requestContent,
          success: function(res) {
            if (res.ret != constants.RET_CODE.OK) {
              console.log("Logout failed: ", res);
            }
            window.cleanupAndGoBackToLoginSceneAnyway();
          },
          error: function(xhr, status, errMsg) {
            window.cleanupAndGoBackToLoginSceneAnyway();
          },
          timeout: function() {
            window.cleanupAndGoBackToLoginSceneAnyway();
          }
        });
      } catch (e) {} finally {
        // For Safari (both desktop and mobile).
        window.cleanupAndGoBackToLoginSceneAnyway();
      }
    } else {
      window.cleanupAndGoBackToLoginSceneAnyway();
    }
  },

  showNarrativeSceneByProperScale(narrativeScene, forStageIndex) {
    if (forStageIndex != this.currentTutorialStage) {
      // 这是一个过时的narrativeSceneNode.
      return;
    }
    const narrativeSceneScriptIns = narrativeScene.getComponent("NarrativeScene");
		for (let node of this.narrativeSceneLayer.children) {
		  node.destroy();
		}
    safelyAddChild(this.narrativeSceneLayer, narrativeScene);
    this.narrativeSceneLayer.active = true;
    this.addInNarrative();
  },

  endCurrentNarrativeSceneIfApplicable(evt) {
    if (null != evt) {
      evt.stopPropagation(); 
    }
    this.removeInNarrative();
  },

  onCurrentNarrativeSceneEnded(targetTutorialGroupIndex, toSpecifiedStage) {
    const previousTutorialStage = this.currentTutorialStage; 

    if (null == targetTutorialGroupIndex) {
      console.warn("You must specify a groupIndex here!");
      return; 
    } 

    const targetTutorialGroupData = constants.TUTORIAL_STAGE_GROUP[targetTutorialGroupIndex]; 
    const successors = targetTutorialGroupData.EDGES[this.currentTutorialStage]; 
    if (null == successors || 0 == successors.length) {
      this.currentTutorialStage = targetTutorialGroupData.END;  
    }  
    const defaultSuccessor = successors[0]; 
    this.currentTutorialStage = defaultSuccessor;
    
    if (null == this.interruptTutorialMask.visitedGroups[targetTutorialGroupIndex]) {
      this.interruptTutorialMask.visitedGroups[targetTutorialGroupIndex] = {
        dictContent: {}
      }
    }
    if (null ==  this.interruptTutorialMask.visitedGroups[targetTutorialGroupIndex].dictContent[previousTutorialStage]) {
      this.interruptTutorialMask.visitedGroups[targetTutorialGroupIndex].dictContent[previousTutorialStage] = {
        listContent: []
      };
    }

    this.interruptTutorialMask.visitedGroups[targetTutorialGroupIndex].dictContent[previousTutorialStage].listContent.push(this.currentTutorialStage);

    this.narrativeSceneLayer.active = false;
    if (null == this.narrativeSceneManager) return;

    this.narrativeSceneManager.showTutorialStage(previousTutorialStage, this.currentTutorialStage);
  },

  initAfterAllTutorialStages() {
    this.removeInNarrative();
  },

  goToTutorialGroupStart(groupIndex) {
    /*
     * This function will eventually resets the persistent storage value of "player_bulk_sync_data.pb_encoded_sync_data.tutorialStage" in backend, but NOT "player.interrupt_tutorial_mask". 
     *
     * The persisted "interrupt_tutorial_mask" merely provides a clue for which option was selected after calling "goToTutorialGroupStart" and re-entered a group.
     *
     * -- YFLu, 2019-10-12.
     */
    const targetGroupData = constants.TUTORIAL_STAGE_GROUP[groupIndex];
    if (null == targetGroupData) {
      console.error("Target groupIndex == ", groupIndex, " doesn't exist!");
      return;
    }
    self.currentTutorialGroupIndex = groupIndex;
    self.currentTutorialStage = targetGroupData.START; 
  },

  changeBgm(audioClip) {
    const self = this;
    if (null == self.gameSettings || null == self.gameSettings.volumePercentage) {
      return;
    }
    if (null == audioClip) {
      cc.warn('switchBgm with audioClip == null, are you want to stop music?');
      return;
    }
    if (self.currentActiveBgmAudioClip != audioClip) {
      self.currentActiveBgmAudioClip = audioClip;
      cc.audioEngine.playMusic(self.currentActiveBgmAudioClip, true);
    } else if (false == cc.audioEngine.isMusicPlaying()) {
      if (null != self.currentActiveBgmAudioClip) {
        cc.audioEngine.playMusic(self.currentActiveBgmAudioClip, true);
      } else {
        cc.warn("I don't know which bgm to play for self.currentActiveBgmAudioClip == null");
      }
    }
  },

  onVolumeActive() {
    const self = this;
    if (null == self.gameSettings || null == self.gameSettings.volumePercentage) {
      return;
    }
    if (null == self.currentActiveBgmAudioClip) {
      self.currentActiveBgmAudioClip = self.activeBgmAudioClip;
    }
    if (false == cc.audioEngine.isMusicPlaying() && null != self.currentActiveBgmAudioClip) {
      cc.audioEngine.playMusic(self.currentActiveBgmAudioClip, true);
    }
    cc.audioEngine.setMusicVolume(self.gameSettings.volumePercentage);
    cc.audioEngine.setEffectsVolume(self.gameSettings.volumePercentage);

    self.gameSettings.volumeToggle = true;
  },

  onVolumeInactive() {
    const self = this;
    cc.audioEngine.setMusicVolume(0);
    cc.audioEngine.setEffectsVolume(0);
    self.gameSettings.volumeToggle = false;
  },

  onVolumeSliderTuned(evt, customEventData) {
    this.gameSettings.volumePercentage = evt.progress;
    if (this.gameSettings.volumeToggle) {
      this.onVolumeActive();
    }
  },

  onGameSettingsTriggerClicked(evt) {
    const self = this;
    self.playEffectCommonButtonClick();
    self.gameSettingsPanelScriptIns.onCloseDelegate = () => {
      self.exitPanelView(self.gameSettingsPanelScriptIns);
      if (null != self.resume) {
        self.resume();
      }
    };
    self.enterPanelView(self.gameSettingsPanelScriptIns);
    if (null != self.pause) {
      self.pause();
    }
  },

  playEffectCommonButtonClick() {
    if (null == this.commonButtonClickAudioClip) return;
    cc.audioEngine.playEffect(this.commonButtonClickAudioClip, false);
  },
});
