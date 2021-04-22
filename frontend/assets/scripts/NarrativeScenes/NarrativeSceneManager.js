const NarrativeSceneManagerDelegate = require('./NarrativeSceneManagerDelegate');
const i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

cc.Class({
  extends: cc.Component,

  properties: {
    narrativeScenePrefab: {
      type: cc.Prefab,
      default: null,
    },
    delegate: {
      type: NarrativeSceneManagerDelegate,
      default: null,
    },
  },

  findGroupIndexByStage(targetStage) {
    const self = this; 
    for (let groupIndex in constants.TUTORIAL_STAGE_GROUP) {
      const groupData = constants.TUTORIAL_STAGE_GROUP[groupIndex];
      if (targetStage == groupData.END) {
        return groupIndex;
      }
      for (let candidateStage in groupData.EDGES) {
        if (candidateStage == targetStage) {
          return groupIndex;
        }
      }  
    } 
    return null;
  }, 

  showTutorialStage(previousTutorialStage, forStageIndex) {
    /*
     *  In IdleGameMap.js and StageMap.js, the zoomRatio will be transit to 1
     *  before call showTutorialStage.
     *  if you want to remove this limit, search 'transitZoomRatioTo'.
     *         --guoyl6, 2019-11-26, 11:34 
     */
    const targetTutorialGroupIndex = this.findGroupIndexByStage(forStageIndex);
    if (null == targetTutorialGroupIndex) {
      console.warn("Calling `NarrativeSceneManager.showTutorialStage`, having `null == targetTutorialGroupIndex`.");
      return;
    }
    const targetTutorialGroupData = constants.TUTORIAL_STAGE_GROUP[targetTutorialGroupIndex]; 
    if (forStageIndex == targetTutorialGroupData.END) {
      // WARNING: Must use exact equaling '==' here!!!
      this.delegate.initAfterAllTutorialStages();
      return; 
    }
    if (null != previousTutorialStage) {
      if (previousTutorialStage != targetTutorialGroupData.END) {
        const narrativeSceneNode = this._getNarrativeScene(forStageIndex);
        this.delegate.showNarrativeSceneByProperScale(narrativeSceneNode, forStageIndex);
      }
    } else {
      // null == previousTutorialStage
      if (forStageIndex != targetTutorialGroupData.END) {
        const narrativeSceneNode = this._getNarrativeScene(forStageIndex); 
        this.delegate.showNarrativeSceneByProperScale(narrativeSceneNode, forStageIndex);
      }
    }
  },

  exitTutorialInGroup() {
    const self = this;
    self.delegate.currentTutorialStage = null;
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _hideCurrentTransitButton(evt, customEventData) {
    const self = this;
    const narrativeSceneNode = self.currentNarrativeSceneNode; 
    const narrativeSceneScriptIns = narrativeSceneNode.getComponent("NarrativeScene");
    
    narrativeSceneScriptIns.transitButton.node.active = false;
  },

  _showCurrentTransitButtion(evt, customEventData) {
    const self = this;
    const narrativeSceneNode = self.currentNarrativeSceneNode; 
    const narrativeSceneScriptIns = narrativeSceneNode.getComponent("NarrativeScene");
    
    narrativeSceneScriptIns.transitButton.node.active = true;

  },

  _getNarrativeScene(byStageIndex) {
    const self = this;
    const targetTutorialGroupIndex = self.findGroupIndexByStage(byStageIndex);
    if (null == targetTutorialGroupIndex) {
      console.warn("Calling `NarrativeSceneManager._getNarrativeScene`, having `null == targetTutorialGroupIndex`.");
      return;
    }
    const targetTutorialGroupData = constants.TUTORIAL_STAGE_GROUP[targetTutorialGroupIndex];

    const narrativeSceneNode = cc.instantiate(this.narrativeScenePrefab);
    let widgetsAboveAllScriptIns = this.delegate.widgetsAboveAllScriptIns;
    this.currentNarrativeSceneNode = narrativeSceneNode;

    const narrativeSceneScriptIns = narrativeSceneNode.getComponent("NarrativeScene");

    self._setNarratorPosition(narrativeSceneNode, false); 

    narrativeSceneScriptIns.transitButton.node.getChildByName("Label").getComponent(cc.Label).string = i18n.t("Tutorial.Next");
    narrativeSceneScriptIns.statement.string = i18n.t("Tutorial.NarrativeStatements." + byStageIndex);

    // Reference http://docs.cocos2d-x.org/creator/api/en/classes/Component.EventHandler.html.
    const theTemplateButtonOnClickHandler = new cc.Component.EventHandler();
    theTemplateButtonOnClickHandler.target = this.delegate.node;
    theTemplateButtonOnClickHandler.component = "NarrativeSceneManagerDelegate"; // Can be any other component attached to `delegate.node`. 
    theTemplateButtonOnClickHandler.handler = "endCurrentNarrativeSceneIfApplicable"; // Can be any other method of `theTemplateButtonOnClickHandler.handler`, as long as `delegate.endCurrentNarrativeSceneIfApplicable()` is guaranteed to be called. 

    narrativeSceneScriptIns.transitButton.clickEvents = [
      theTemplateButtonOnClickHandler,
    ];
  
    let thePanelNode = null;
    let thePanelButton = null;
    let thePanelScriptIns = null;
    let anotherButtonOnClickHandler = null;
    let yetAnotherButtonOnClickHandler = null;
    let popupAnimDurationSeconds = 0.5;
    let hiddenTransiteButtonNode = null;

    let fakeStatelessBuildableInstanceCardListNode = null;
    let fakeStatelessBuildableInstanceCardListScriptIns = null;

    let theConfirmButton = null;
    let theHqCardScriptIns = null;
    let targetedStatelessBuildableInstance = null;

    let targetedHqInstance = null;
    let targetedHeadquarterInstance = null;
    let targetedFarmlandInstance = null;
    let targetedSnackInstance = null;

    let progressBarNode = null;
    let progressBarNodeContainer = null;

    let buildOrProgressBarScriptIns = null; 
    let originalCompletedCb = null;

    let statefulBuildableIngredientProgressListEntryIns = null, highlightedStatefulBuildableIngredientProgressListEntryIns = null;

    let editingStatefulBuildableInstance = null;

    let controller = null;

    let _ = null, __ = null;
    
    let initialBuildableIds = [constants.STATELESS_BUILDABLE_ID.HEADQUARTER, constants.STATELESS_BUILDABLE_ID.MARKET];

    let targetOrderingNpcIns = null;
    
    let targetedMarketInstance = null;
    let targetedStageGoalQuestListNode = null;
    let targetedTowerInstance = null;
    let toCollectIncomeScriptIns = null;

    let cachedGoldIns = null;

    let originalPosition = null, originalParent = null, originalFn = null;

    let widgetsAboveAllSideButtonGroupNode = null;
    let buildButton = null;

    let shadowLayer = null;
    let currentLayerSize = null;

    let roughContinuousPosWrtMapNode = null, discretePosWrtMapNode = null;

    let inBattleSoldierPanelScriptIns = null;
    let escapingAttackingNpcScriptIns = null;

    let targetedFortressInstance = null;

    let idlePlayerArchivePanelIns = null, ingredientCellInfoPanelIns = null;

    targetedSnackInstance = this.delegate.statefulBuildableInstanceCompList.find((x) => { return x.id == constants.STATELESS_BUILDABLE_ID.SNACK; });
    targetedHeadquarterInstance = this.delegate.statefulBuildableInstanceCompList.find((x) => { return x.id == constants.STATELESS_BUILDABLE_ID.HEADQUARTER; });
    targetedMarketInstance = this.delegate.statefulBuildableInstanceCompList.find((x) => { return x.id == constants.STATELESS_BUILDABLE_ID.MARKET; });
    targetedTowerInstance = this.delegate.statefulBuildableInstanceCompList.find((x) => { return x.id == constants.STATELESS_BUILDABLE_ID.FIRE_TOWER; });

    switch (byStageIndex) {
      case 0:
        self.delegate.moveCameraToPosition(self.delegate.buildableInitialPositionMap[constants.STATELESS_BUILDABLE_ID.HEADQUARTER], 0);
        self.delegate.endCurrentNarrativeSceneIfApplicable();
        break;
      case 1:
        for (let buildableId of initialBuildableIds) {
          let statefulBuildableInstance = self.delegate.getStatefulBuildableInstanceListByBuildableId(buildableId)[0];
          if (null != statefulBuildableInstance) {
            continue;
          }
          targetedStatelessBuildableInstance = self.delegate._findStatelessBuildableInstance({
            buildable: {
              id: buildableId,
            }
          });
          statefulBuildableInstance = self.delegate.createPerStatefulBuildableInstanceNodes(null, targetedStatelessBuildableInstance);
          statefulBuildableInstance.updateCriticalProperties(
            window.STATEFUL_BUILDABLE_INSTANCE_STATE.IDLE,
            self.delegate.buildableInitialPositionMap[buildableId],
            1,
            null,
            true  //true means that the updateCriticalProperties should not call upsync
          );
          self.delegate.onStatefulBuildableInstanceCreated(statefulBuildableInstance);
          self.delegate.createBoundaryColliderForStatefulBuildableInstance(statefulBuildableInstance);
          self.delegate.refreshOrCreateIngredientAcceptor(statefulBuildableInstance);
          self.delegate.statefulBuildableInstanceList.push(statefulBuildableInstance.playerBuildableBinding);
          self.delegate.statefulBuildableInstanceCompList.push(statefulBuildableInstance);
          self.delegate.renderPerStatefulBuildableInstanceNode(statefulBuildableInstance);
          self.delegate.refreshOrCreateShelterAndDefenderForStatefulBuildableInstance(statefulBuildableInstance);
          self.delegate.refreshLawnForStatefulBuildableInstance(statefulBuildableInstance);
        }
        self.delegate.updateOverallGoldLimit();
        window.refreshCachedKnownBarrierGridDict(self.delegate.node, self.delegate.barrierColliders, null);

        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        controller.hide();
        self.delegate.moveCameraToPosition(self.delegate.buildableInitialPositionMap[constants.STATELESS_BUILDABLE_ID.HEADQUARTER], 0, function() {
          controller.show();
        });
        break;
      case 2:  
        narrativeSceneScriptIns.maskLayer.active = false;
        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        controller.hide(); // hide highlightedNode, while touch listerner still enabled.
        self.delegate.moveCameraToPosition(self.delegate.buildableInitialPositionMap[constants.STATELESS_BUILDABLE_ID.HEADQUARTER], 0, function() {
          // OrderingNpc staying at homePosition. [begin]
          targetOrderingNpcIns = self._spawnOrderingNpcSingleton();
          targetOrderingNpcIns.node.position = targetOrderingNpcIns.homePosInMapNode = self.delegate.attackingNpcPositionInMapNodeList[0];
          targetOrderingNpcIns.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDERING_AT_DESTINATION_AFTER_MOVING_IN;
          targetOrderingNpcIns.setAnim(targetOrderingNpcIns.speciesName, function() {
            targetOrderingNpcIns._playAnimComp("BottomLeft");
          });
          // OrderingNpc staying at homePosition. [end]
          /*
           * if you replace the following code: 'active = fasle' as 'opacity = 0'
           * and 'active = true' as 'opacity = 255', then the following thing will happen:
           * when you click the transitButton in prev case, the prev case's narrativeSceneNode will be destroy,
           * and this case's narrativeSceneNode will be loading,
           * and if you quickly click screen while the moving action for camera is active, 
           * the priority of touch listen will be this:
           * narrativeSceneNode > transitButton
           * and it cause that the transitButton's touchEvent can not be dispatch.
           *   --guoyl6, 2019/10/20
           */
          // narrativeSceneScriptIns.narrativeContainer.opacity = 0;
          narrativeSceneScriptIns.narrativeContainer.active = false;
          self.delegate.moveCameraToPosition(targetOrderingNpcIns.node.position, 0.5, function() {
            // narrativeSceneScriptIns.narrativeContainer.opacity = 255;
            narrativeSceneScriptIns.narrativeContainer.active = true;
            controller.show();
          });
        });
        break;
      case 3:
         // OrderingNpc staying at homePosition. [begin]
        self.delegate.refreshBuildButtonCountTip();
        targetOrderingNpcIns = self._spawnOrderingNpcSingleton();
        targetOrderingNpcIns.node.position = targetOrderingNpcIns.homePosInMapNode = self.delegate.attackingNpcPositionInMapNodeList[0];
        targetOrderingNpcIns.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.ORDERING_AT_DESTINATION_AFTER_MOVING_IN;
        targetOrderingNpcIns.setAnim(targetOrderingNpcIns.speciesName, function() {
          targetOrderingNpcIns._playAnimComp("BottomLeft");
        });
        // OrderingNpc staying at homePosition. [end]       targetOrderingNpcIns = self._spawnOrderingNpcSingleton();
        narrativeSceneScriptIns.transitButton.node.active = false;
        widgetsAboveAllSideButtonGroupNode = widgetsAboveAllScriptIns.sideButtonGroupNode; 
        buildButton = widgetsAboveAllScriptIns.buildButton;
        controller = self._focusOnNode(buildButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        controller.hide();
        self.delegate.moveCameraToPosition(targetOrderingNpcIns.node.position, 0.5, function() {
          controller.show();
        });
        
      break;
      case 4:
        self._setNarratorPosition(narrativeSceneNode, true);
        narrativeSceneScriptIns.transitButton.node.active = false;
        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {}, false);
        controller.hide();
        self.delegate.moveCameraToPosition(self.delegate.buildableInitialPositionMap[constants.STATELESS_BUILDABLE_ID.SNACK], 0.5, function() {
          controller.show(); // if hiden before, should call show before resolve.
          controller.resolve();
          self._showStatelessCardToClick(narrativeSceneNode, constants.STATELESS_BUILDABLE_ID.SNACK, "_onSnackCardClicked");
        });
      break;
      case 5:
        self._setNarratorPosition(narrativeSceneNode, true);
        self.delegate.moveCameraToPosition(self.delegate.buildableInitialPositionMap[constants.STATELESS_BUILDABLE_ID.SNACK], 0);
        targetedStatelessBuildableInstance = self.delegate._findStatelessBuildableInstance({
          buildable: {
            id: constants.STATELESS_BUILDABLE_ID.SNACK
          }
        });
        editingStatefulBuildableInstance = self.delegate.startPositioningNewStatefulBuildableInstance(targetedStatelessBuildableInstance);
        self._startPositioningNewStatefulBuildableInstance(editingStatefulBuildableInstance);
        narrativeSceneScriptIns.maskLayer.active = false;
        widgetsAboveAllScriptIns.statefulBuildableController.active = false;
      
        theConfirmButton = widgetsAboveAllScriptIns.confirmBuildButton;    

        anotherButtonOnClickHandler = new cc.Component.EventHandler();
        anotherButtonOnClickHandler.target = this.node;
        anotherButtonOnClickHandler.component = "NarrativeSceneManager";
        anotherButtonOnClickHandler.handler = "_onFirstSnackEndedPositioning";  
        anotherButtonOnClickHandler.customEventData = editingStatefulBuildableInstance; 

        // WARNING: The order of `clickEvents` is important!
        narrativeSceneScriptIns.transitButton.clickEvents = [
          anotherButtonOnClickHandler,
        ];

        narrativeSceneScriptIns.transitButton.node.parent = narrativeSceneNode;
        narrativeSceneScriptIns.transitButton.node.setPosition(widgetsAboveAllScriptIns.statefulBuildableController.position); // This is a dirty hack!
        this.updateTransitButton(narrativeSceneScriptIns.transitButton.node, theConfirmButton.node);
      break;
      case 6:
        narrativeSceneScriptIns.transitButton.node.active = false;
        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {}, false);
        controller.hide();
        self.delegate.moveCameraToPosition(targetedSnackInstance.node.position, 0.5, function() {
          if (!targetedSnackInstance.isBuilding()) {
            self._onFirstSnackBuilt(targetedSnackInstance, null);
            return;
          }
          buildOrProgressBarScriptIns = targetedSnackInstance._progressInstanceNode.getComponent("BuildOrUpgradeProgressBar");
          progressBarNodeContainer = new cc.Node();
          progressBarNode = targetedSnackInstance._progressInstanceNode;
          targetedSnackInstance.disableBoostButton();
          safelyAddChild(narrativeSceneNode, progressBarNodeContainer);
          safelyAssignParent(progressBarNode, progressBarNodeContainer);
          progressBarNodeContainer.position = self._mapNodePosToWidgetsAboveAllPos(targetedSnackInstance.node.position);
          originalCompletedCb = buildOrProgressBarScriptIns.onCompleted;
          buildOrProgressBarScriptIns.onCompleted = function() {
            originalCompletedCb.apply(this, arguments);
            self._onFirstSnackBuilt(targetedSnackInstance, progressBarNodeContainer);
            buildOrProgressBarScriptIns.onCompleted = originalCompletedCb;
            controller.show(); // if hiden before, should call show before resolve.
            controller.resolve();
          }
        });
        break;
      case 7:
        narrativeSceneScriptIns.transitButton.node.active = false;
        narrativeSceneScriptIns.maskLayer.active = false;
        // Initialization of OrderingNpc. [begin]
        targetOrderingNpcIns = self._spawnOrderingNpcSingleton();
        targetOrderingNpcIns.npcId = targetOrderingNpcIns.node.uuid;
        targetOrderingNpcIns.node.position = targetOrderingNpcIns.homePosInMapNode = self.delegate.attackingNpcPositionInMapNodeList[0];
        targetOrderingNpcIns.boundStatefulBuildable = targetedSnackInstance;
        if (null == targetedSnackInstance.boundOrderingNpcDict) {
          targetedSnackInstance.boundOrderingNpcDict = {};
        }
        targetedSnackInstance.boundOrderingNpcDict[targetOrderingNpcIns.node.uuid] = targetOrderingNpcIns;
        targetOrderingNpcIns.targetChair = Object.values(targetedSnackInstance.chairOffsetDict)[0];
        targetOrderingNpcIns.setChairDirection("TopRight");
        targetOrderingNpcIns.specifiedOffsetFromSpriteCentre = cc.v2(targetOrderingNpcIns.targetChair.offsetX, targetOrderingNpcIns.targetChair.offsetY);
        targetOrderingNpcIns.state = window.STATEFUL_BUILDABLE_ORDERING_NPC_STATE.MOVING_IN;
        targetOrderingNpcIns.refreshGrandSrcAndCurrentDestination();
        targetOrderingNpcIns.refreshContinuousStopsFromCurrentPositionToCurrentDestination();
        // Initialization of OrderingNpc. [end]
        let p = self._focusOnNode(new cc.Node(), function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        p.hide();
        self.delegate.moveCameraToPosition(targetOrderingNpcIns.currentDestination, 0.5, function() {
          targetOrderingNpcIns.restartFollowing();
          targetOrderingNpcIns.onStayingAtTargetDestination = function() {
            narrativeSceneScriptIns.statement.string = i18n.t("Tutorial.NarrativeStatements.7_1");
            p.disable(); 
            targetOrderingNpcIns.transitToOrderingAtDestinationAfterMovingIn();

            targetOrderingNpcIns.shelterChinColliderNode.active = false;
            window.removeFromGlobalShelterChainVerticeMap(targetOrderingNpcIns.node);
            let targetChairNode = targetOrderingNpcIns.boundStatefulBuildable.chairNodeDict[targetOrderingNpcIns.targetChair.chairId];
            setLocalZOrder(targetOrderingNpcIns.node, getLocalZOrder(targetChairNode) - 1);

            let autoOrder = self.delegate.tryToGenerateFreeAutoOrderForNpc(targetOrderingNpcIns);
            autoOrder.timeoutMillisBeforeTaken = Infinity;
            targetOrderingNpcIns.boundAutoOrder = autoOrder;
            narrativeSceneScriptIns.maskLayer.active = true;
            originalParent = autoOrder.targetAutoOrderPopup.node.parent;
            originalPosition = autoOrder.targetAutoOrderPopup.node.position;
            let positionInNarrativeScene = self._mapNodePosToWidgetsAboveAllPos(originalPosition);
            autoOrder.targetAutoOrderPopup.node.parent = narrativeSceneNode;
            autoOrder.targetAutoOrderPopup.node.position = positionInNarrativeScene;
            autoOrder.targetAutoOrderPopup.show = function() {
              autoOrder.targetAutoOrderPopup.node.position = positionInNarrativeScene;
            }
            controller = self._focusOnNode(autoOrder.targetAutoOrderPopup.node, function() {
              autoOrder.targetAutoOrderPopup.node.parent = originalParent;
              autoOrder.targetAutoOrderPopup.node.position = originalPosition;
              let _originalPlayEatingAnimation = autoOrder.targetAutoOrderPopup.playEatingAnimation;
              autoOrder.targetAutoOrderPopup.playEatingAnimation = function(durationMillis, cb) {
                autoOrder.targetAutoOrderPopup.playEatingAnimation = _originalPlayEatingAnimation;
                _originalPlayEatingAnimation.call(this, durationMillis, function() {
                  cb && cb.apply(this, arguments);
                  window.addToGlobalShelterChainVerticeMap(targetOrderingNpcIns.node);
                  targetOrderingNpcIns.shelterChinColliderNode.active = true;
                  p.show();
                  p.resolve(); 
                });
              }
              autoOrder.targetAutoOrderPopup.onClicked(autoOrder); 
              narrativeSceneScriptIns.maskLayer.active = false;
              narrativeSceneScriptIns.statement.string = i18n.t("Tutorial.NarrativeStatements.7_2");
              p.enable();
            }, true);
            controller.highlightedNode.opacity = 0;
          }
          targetOrderingNpcIns.onStayingAtHomeDestination = function() {
            self.delegate.removeOrderingNpc(targetOrderingNpcIns);
          }
        });
        break;
      case 8:
        if (null == self.delegate.cachedGoldNodeList || 0 >= self.delegate.cachedGoldNodeList.length) {
          console.warn("I can not find any cachedGoldNode here.");
          self.delegate.endCurrentNarrativeSceneIfApplicable();
          break;
        } else {
          cachedGoldIns = self.delegate.cachedGoldNodeList[self.delegate.cachedGoldNodeList.length-1].getComponent('CachedGold');
          narrativeSceneScriptIns.transitButton.node.active = false;
          narrativeSceneScriptIns.maskLayer.active = false;
          narrativeSceneScriptIns.narrativeContainer.active = false;
          let targetSpriteNode = cachedGoldIns.node;
          controller = self._focusOnNode(targetSpriteNode, function() {
            narrativeSceneScriptIns.maskLayer.active = false;
            targetSpriteNode.parent = originalParent;
            targetSpriteNode.position = originalPosition;
            let forbidTouch = self._focusOnNode(new cc.Node(), function() {}, false);
            let originalFlyCompletedCb = cachedGoldIns.onCoinFallFlyCompleted;
            cachedGoldIns.onCoinFallFlyCompleted = function() {
              cachedGoldIns.onCoinFallFlyCompleted = originalFlyCompletedCb;
              originalFlyCompletedCb && originalFlyCompletedCb.apply(this, arguments);
              forbidTouch.resolve();
              self.delegate.endCurrentNarrativeSceneIfApplicable();
            }
            cachedGoldIns.onSelfClicked();
          }, true);
          controller.hide();
          let cameraMoveCompleted = false, spawnCompleted = false;
          let cbOnce = function() {
            if (!cameraMoveCompleted || !spawnCompleted) {
              return;
            }
            if (null == cbOnce) {
              return;
            }
            cbOnce = null;
            controller.show();
            controller.highlightedNode.opacity = 0;
            narrativeSceneScriptIns.maskLayer.active = true;
            narrativeSceneScriptIns.narrativeContainer.active = true;
            originalPosition = targetSpriteNode.position;
            originalParent = targetSpriteNode.parent;
            targetSpriteNode.parent = narrativeSceneNode;
            targetSpriteNode.position = self._mapNodePosToWidgetsAboveAllPos(originalPosition);
          }
          self.delegate.moveCameraToPosition(targetSpriteNode.position, 0.5, function() {
            cameraMoveCompleted = true;
            cbOnce && cbOnce();
          });
          spawnCompleted = true;
        }
        break;
      case 9:
        originalPosition = targetedMarketInstance.node.position;
        originalParent = targetedMarketInstance.node.parent;
        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          targetedMarketInstance.node.parent = originalParent;
          targetedMarketInstance.node.position = originalPosition;
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        controller.hide();
        self.delegate.moveCameraToPosition(targetedMarketInstance.node.position, 0.5, function() {
          controller.show();
          targetedMarketInstance.node.parent = narrativeSceneNode;
          targetedMarketInstance.node.position = self._mapNodePosToWidgetsAboveAllPos(originalPosition);
        });
        break;
      case 10:
        narrativeSceneScriptIns.transitButton.node.active = false;
        toCollectIncomeScriptIns = targetedMarketInstance.node.toCollectIncomeNode.getComponent('ToCollectIncome');
        toCollectIncomeScriptIns.node.active = true;
        controller = self._focusOnNode(toCollectIncomeScriptIns.node, function() {
          narrativeSceneScriptIns.maskLayer.active = false;
          toCollectIncomeScriptIns.node.opacity = 255;
          toCollectIncomeScriptIns.node.active = false;
          toCollectIncomeScriptIns.setData(
            2000  // Hardcoded temporarily, 启动资金
            // targetedMarketInstance.levelConfs.find(function(x) {return x.level == 1;}).goldLimitAddition
          );
          self.delegate.collectAutoIncreaseCachedGold(targetedMarketInstance, true);
          self.delegate.playEffectCollectGold();
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        controller.hide();
        self.delegate.moveCameraToPosition(targetedMarketInstance.node.position, 0.5, function() {
          toCollectIncomeScriptIns.node.opacity = 0;
          controller.show();
        });
        break;
      case 11:
        originalPosition = targetedHeadquarterInstance.node.position;
        originalParent = targetedHeadquarterInstance.node.parent;
        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          targetedHeadquarterInstance.node.parent = originalParent;
          targetedHeadquarterInstance.node.position = originalPosition;
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        controller.hide();
        self.delegate.moveCameraToPosition(targetedHeadquarterInstance.node.position, 0.5, function() {
          controller.show();
          targetedHeadquarterInstance.node.parent = narrativeSceneNode;
          targetedHeadquarterInstance.node.position = self._mapNodePosToWidgetsAboveAllPos(originalPosition);
        })
        break;
      case 12:
        self.delegate.widgetsAboveAllScriptIns.sideButtonGroupNode.active = true;
        self.delegate.widgetsAboveAllScriptIns.sideButtonGroupNode.getComponentsInChildren(cc.Layout).forEach(function(layout) {
          layout.updateLayout();
        });
        let q = self._focusOnNode(self.delegate.widgetsAboveAllScriptIns.archiveButton.node, function() {}, false);
        q.disable();
        self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          q.resolve();
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        break;
      case 13:
        narrativeSceneScriptIns.transitButton.node.getChildByName("Label").getComponent(cc.Label).string = i18n.t("Tutorial.Finish");
        self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        break;
      case 18:
        narrativeSceneScriptIns.transitButton.node.active = false;

        const fakeEscapingTargetNode = cc.instantiate(self.delegate.escapingTargetPrefab);

        self.delegate.moveCameraToPosition(self.delegate.escapingTargetList[0], 0.5, () => {
          const fakeEscapingTargetNodePos = self._mapNodePosToWidgetsAboveAllPos(self.delegate.escapingTargetList[0]);
          fakeEscapingTargetNode.setPosition(fakeEscapingTargetNodePos);
          safelyAddChild(narrativeSceneNode, fakeEscapingTargetNode);
          narrativeSceneScriptIns.transitButton.node.active = true;
        });
        break; 
      case 19:
        narrativeSceneScriptIns.statement.string = cc.js.formatStr(i18n.t("Tutorial.NarrativeStatements.19"), 30);

        targetedStageGoalQuestListNode = this.delegate.stageGoalQuestListNode;
        safelyAssignParent(targetedStageGoalQuestListNode, narrativeSceneNode);
        targetedStageGoalQuestListNode.active = true;

        anotherButtonOnClickHandler = new cc.Component.EventHandler();
        anotherButtonOnClickHandler.target = this.node;
        anotherButtonOnClickHandler.component = "NarrativeSceneManager";
        anotherButtonOnClickHandler.handler = "_onStageGoalQuestRead";  

        // WARNING: The order of `clickEvents` is important!
        narrativeSceneScriptIns.transitButton.clickEvents = [
          anotherButtonOnClickHandler,
          theTemplateButtonOnClickHandler,
        ];
        break;
      case 20:
        const chosenGrandSrc = this.delegate.escapingAttackingNpcPositionInMapNodeList[4];
        const chosenTargetPos = this.delegate.escapingTargetList[0];
        const speciesNameKey = "SOLDIER";
        this._spawnEscapingAttackingNpc(chosenGrandSrc, chosenTargetPos, constants.NPC_ANIM.NAME[speciesNameKey]);

        narrativeSceneScriptIns.maskLayer.active = false;
        narrativeSceneScriptIns.transitButton.node.active = false;
        break;
      case 21:
        narrativeSceneScriptIns.transitButton.node.active = false;
        widgetsAboveAllSideButtonGroupNode = widgetsAboveAllScriptIns.sideButtonGroupNode; 
        buildButton = widgetsAboveAllScriptIns.buildButton;
        controller = self._focusOnNode(buildButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        controller.show();
        break;
      case 22:
        self._setNarratorPosition(narrativeSceneNode, true);
        narrativeSceneScriptIns.transitButton.node.active = false;
        self._showStatelessCardToClick(narrativeSceneNode, constants.STATELESS_BUILDABLE_ID.FIRE_TOWER, "_onTowerCardClicked");
        break;
      case 23:
        self.delegate.findStatefulBuildableInstanceAtPosition = self.delegate.__proto__.findStatefulBuildableInstanceAtPosition;
        self._setNarratorPosition(narrativeSceneNode, true);
        targetedStatelessBuildableInstance = self.delegate._findStatelessBuildableInstance({
          buildable: {
            id: constants.STATELESS_BUILDABLE_ID.FIRE_TOWER
          }
        });
        editingStatefulBuildableInstance = self.delegate.startPositioningNewStatefulBuildableInstance(targetedStatelessBuildableInstance);
        self._startPositioningNewStatefulBuildableInstance(editingStatefulBuildableInstance);
        narrativeSceneScriptIns.maskLayer.active = false;
        widgetsAboveAllScriptIns.statefulBuildableController.active = false;
      
        theConfirmButton = widgetsAboveAllScriptIns.confirmBuildButton;    

        anotherButtonOnClickHandler = new cc.Component.EventHandler();
        anotherButtonOnClickHandler.target = this.node;
        anotherButtonOnClickHandler.component = "NarrativeSceneManager";
        anotherButtonOnClickHandler.handler = "_onTowerEndedPositioning";  
        anotherButtonOnClickHandler.customEventData = editingStatefulBuildableInstance; 

        // WARNING: The order of `clickEvents` is important!
        narrativeSceneScriptIns.transitButton.clickEvents = [
          anotherButtonOnClickHandler,
        ];

        narrativeSceneScriptIns.transitButton.node.setPosition(widgetsAboveAllScriptIns.statefulBuildableController.position); // This is a dirty hack!
        safelyAssignParent(narrativeSceneScriptIns.transitButton.node, narrativeSceneNode);
        this.updateTransitButton(narrativeSceneScriptIns.transitButton.node, theConfirmButton.node);
        break;
      case 24:
        narrativeSceneScriptIns.transitButton.node.active = false;
        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {}, false);
        controller.hide();
        self.delegate.moveCameraToPosition(targetedTowerInstance.node.position, 0.5, function() {
          if (!targetedTowerInstance.isBuilding()) {
            self._onTowerBuilt(targetedTowerInstance, null);
            return;
          }
          buildOrProgressBarScriptIns = targetedTowerInstance._progressInstanceNode.getComponent("BuildOrUpgradeProgressBar");
          progressBarNodeContainer = new cc.Node();
          progressBarNode = targetedTowerInstance._progressInstanceNode;
          targetedTowerInstance.disableBoostButton();
          progressBarNodeContainer.setPosition(self._mapNodePosToWidgetsAboveAllPos(targetedTowerInstance.node.position));

          safelyAddChild(narrativeSceneNode, progressBarNodeContainer);
          safelyAssignParent(progressBarNode, progressBarNodeContainer);

          originalCompletedCb = buildOrProgressBarScriptIns.onCompleted;
          buildOrProgressBarScriptIns.onCompleted = function() {
            originalCompletedCb.apply(this, arguments);
            self._onTowerBuilt(targetedTowerInstance, progressBarNodeContainer);
            buildOrProgressBarScriptIns.onCompleted = originalCompletedCb;
            controller.show(); // if hiden before, should call show before resolve.
            controller.resolve();
          }
        });
        break;
      case 35:
        narrativeSceneScriptIns.maskLayer.active = true;
        currentLayerSize = self.delegate.highlighterLayer.getLayerSize();

        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        controller.hide();
        self.delegate.moveCameraToPosition(self.delegate.initialCameraPos, 0.3, function() {
          for (let k in self.delegate.soldierDroppables) {
            const droppablePolygon = self.delegate.soldierDroppables[k];
            // highlight droppable area. [begin]
            for (let discreteXInLayer = 0; discreteXInLayer < currentLayerSize.width; ++discreteXInLayer) {
              for (let discreteYInLayer = 0; discreteYInLayer < currentLayerSize.height; ++discreteYInLayer) {
                let continuousPosWrtMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(self.delegate.node, self.delegate.tiledMapIns, null, discreteXInLayer, discreteYInLayer);
                if (false == cc.Intersection.pointInPolygon(continuousPosWrtMapNode, droppablePolygon)) {
                  continue; 
                }
                const highlighterNode = cc.instantiate(self.delegate.tileHighlighterPrefab);
                highlighterNode.setPosition(continuousPosWrtMapNode.sub(self.delegate.initialCameraPos));
                safelyAddChild(narrativeSceneNode, highlighterNode);
                setLocalZOrder(highlighterNode, CORE_LAYER_Z_INDEX.INFINITY - 1);
                highlighterNode.getComponent("TileHighlighter").soldierDroppable.node.active = true;
                // Highlight each droppable tile. 
              }
            }
            // highlight droppable area. [end]
          }

          controller.show();
          setLocalZOrder(narrativeSceneScriptIns.narrativeContainer, CORE_LAYER_Z_INDEX.INFINITY); 
        });
      break;
      case 36:
        narrativeSceneScriptIns.maskLayer.active = true;
        discretePosWrtMapNode = tileCollisionManager._continuousToDiscrete(self.delegate.node, self.delegate.tiledMapIns, self.delegate.initialCameraPos, cc.v2(0, 0));
        roughContinuousPosWrtMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(self.delegate.node, self.delegate.tiledMapIns, null, discretePosWrtMapNode.x, discretePosWrtMapNode.y);
        let tmpNode = new cc.Node();
        tmpNode.position = roughContinuousPosWrtMapNode;
        tmpNode.setContentSize(self.delegate.tiledMapIns.getTileSize());
        safelyAddChild(self.delegate.node, tmpNode);
        narrativeSceneScriptIns.narrativeContainer.active = false;
        narrativeSceneScriptIns.transitButton.node.active = false;
        controller = self._focusOnNode(tmpNode, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        controller.hide();
        self.delegate.moveCameraToPosition(_.position, 0.3, function() { 
          const highlighterNode = cc.instantiate(self.delegate.tileHighlighterPrefab);
          highlighterNode.setPosition(roughContinuousPosWrtMapNode.sub(_.position));
          safelyAddChild(narrativeSceneNode, highlighterNode);
          setLocalZOrder(highlighterNode, CORE_LAYER_Z_INDEX.INFINITY - 1);
          highlighterNode.getComponent("TileHighlighter").soldierDroppable.node.active = true;

          narrativeSceneScriptIns.narrativeContainer.active = true;
          controller.show();
          setLocalZOrder(narrativeSceneScriptIns.narrativeContainer, CORE_LAYER_Z_INDEX.INFINITY); 
        });
      break;
      case 37:
        narrativeSceneScriptIns.maskLayer.active = false;
        narrativeSceneScriptIns.narrativeContainer.active = false;
        discretePosWrtMapNode = tileCollisionManager._continuousToDiscrete(self.delegate.node, self.delegate.tiledMapIns, self.delegate.initialCameraPos, cc.v2(0, 0));
        roughContinuousPosWrtMapNode = tileCollisionManager._continuousFromCentreOfDiscreteTile(self.delegate.node, self.delegate.tiledMapIns, null, discretePosWrtMapNode.x, discretePosWrtMapNode.y);
        inBattleSoldierPanelScriptIns = self.delegate.inBattleSoldierPanelScriptIns;
        if (null == inBattleSoldierPanelScriptIns) {
          console.warn('An inBattleSoldierPanelScriptIns is required.');
          self.delegate.endCurrentNarrativeSceneIfApplicable();
          break;
        }
        if (null == inBattleSoldierPanelScriptIns.activeSoldier || 
            0 >= inBattleSoldierPanelScriptIns.activeSoldier.currentCount) {
          console.warn('An activeSoldier is required.');
          self.delegate.endCurrentNarrativeSceneIfApplicable();
          break;
        }
        escapingAttackingNpcScriptIns = self.delegate.spawnEscapingAttackingNpc(
          roughContinuousPosWrtMapNode,
          self.delegate.allyEscapingTargetList[0],
          constants.NPC_ANIM.NAME[inBattleSoldierPanelScriptIns.activeSoldier.ingredient.name],
          inBattleSoldierPanelScriptIns.activeSoldier
        );

        --inBattleSoldierPanelScriptIns.activeSoldier.currentCount;
        inBattleSoldierPanelScriptIns.refresh();
        if (0 >= inBattleSoldierPanelScriptIns.activeSoldier.currentCount) {
          inBattleSoldierPanelScriptIns.searchForAndSwitchToPossibleActiveSoldier();
        }

        targetedTowerInstance = self.delegate.getStatefulBuildableInstanceListByBuildableId(
          constants.STATELESS_BUILDABLE_ID.STONE_TOWER
        )[0];

        if (targetedTowerInstance == null) {
          console.warn('A stone tower is required.');
          self.delegate.endCurrentNarrativeSceneIfApplicable();
          break;
        }

        escapingAttackingNpcScriptIns.node.on(cc.Node.EventType.POSITION_CHANGED, function() {
          self.delegate.moveCameraToPosition(escapingAttackingNpcScriptIns.node.position, 0, null);
        });

        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, false);
        controller.hide();

        originalFn = targetedTowerInstance.onShotByBullet;
        targetedTowerInstance.onShotByBullet = function() {
          targetedTowerInstance.onShotByBullet = originalFn;
          controller.show();
          controller.resolve();
          escapingAttackingNpcScriptIns.node.off(cc.Node.EventType.POSITION_CHANGED, _);
        }
      break;
      case 38:
        self.delegate.pause();
        self.delegate.stageGoalQuestListNode.active = true;
        originalParent = self.delegate.stageGoalQuestListNode.parent;
        self.delegate.stageGoalQuestListNode.parent = narrativeSceneNode;
        self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
          self.delegate.stageGoalQuestListNode.parent = originalParent;
        }, true);
      break;
      case 39:
        if (!self.delegate.isPaused()) {
          self.delegate.pause();
        }
        let pp = self.delegate.getStatefulBuildableInstanceListByBuildableId(
          self.delegate.stageGoal.questList[0].resourceTargetId
        )[0];
        if (null == pp) {
          console.warn('A buildable with buildableId', self.delegate.stageGoal.questList[0].resourceTargetId, 'is required.');
          self.delegate.endCurrentNarrativeSceneIfApplicable();
          break;
        }
        originalParent = pp.node.parent;
        originalPosition = pp.node.position;
        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          pp.node.parent = originalParent;
          pp.node.position = originalPosition;
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
        controller.hide();
        self.delegate.moveCameraToPosition(pp.node.position, 0.3, function() {
          pp.node.parent = narrativeSceneNode;
          pp.node.position = self._mapNodePosToWidgetsAboveAllPos(originalPosition);
          controller.show();
        });
      break;
      case 40:
        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          if (self.delegate.isPaused()) {
            self.delegate.resume();
          }
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
      break;
      case 41:
        controller = self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        });
        controller.hide();
        narrativeSceneScriptIns.narrativeContainer.active = false;
        try {
          let widget = self.delegate.widgetsAboveAllScriptIns.stageTimerNode.getComponent(cc.Widget);
          if (null != widget) {
            widget.updateAlignment();
          }
          let progressNumberIns = self.delegate.widgetsAboveAllScriptIns.stageTimerNode.getComponent('ProgressNum');
          let timerNode = cc.instantiate(progressNumberIns.indicatorLabel.node);
          timerNode.removeComponent(cc.Widget);
          let timerLabel = timerNode.getComponent(cc.Label);
          if (self.delegate.stageGoal.timeLimitSeconds > 60) {
            timerLabel.string = window.secondsToNaturalExp(self.delegate.stageGoal.timeLimitSeconds);
          } else {
            timerLabel.string = cc.js.formatStr(i18n.t("duration.seconds"), self.delegate.stageGoal.timeLimitSeconds);
          }
          let tipNode = new cc.Node();
          let tipLabel = tipNode.addComponent(cc.Label);
          tipLabel.string = i18n.t("Tutorial.GameStart");
          tipLabel.fontSize = timerLabel.fontSize;
          tipLabel.lineHeight = timerLabel.fontSize;
          tipNode.opacity = 255;
          timerNode.opacity = 0;
          tipNode.scale = timerNode.scale = 2;
          safelyAddChild(narrativeSceneNode, tipNode);
          safelyAddChild(narrativeSceneNode, timerNode);
          tipNode.position = cc.v2(0, 0);
          timerNode.position = cc.v2(0, 0);
          tipNode.runAction(
            cc.sequence(
              cc.delayTime(1),
              cc.fadeOut(0.5),
              cc.callFunc(function() {
                tipNode.removeFromParent();
                timerNode.runAction(
                  cc.sequence(
                    cc.fadeIn(0.5),
                    cc.delayTime(1),
                    cc.spawn(
                      cc.moveTo(0.7, self.delegate.widgetsAboveAllScriptIns.stageTimerNode.position),
                      cc.scaleTo(0.7, 1),
                    ),
                    cc.delayTime(0.3),
                    cc.callFunc(function() {
                      timerNode.removeFromParent();
                      controller.show();
                      controller.resolve();
                    })
                  )
                )
              })
            )
          );
        } catch (e) {
          controller.show();
          controller.resolve();
        };
      break;
      case 50:
        narrativeSceneScriptIns.transitButton.node.active = false;
        if (null != self.delegate.idlePlayerArchivePanelIns && !self.delegate.idlePlayerArchivePanelIns.isHidden()) {
          self.scheduleOnce(function() {
            self.delegate.endCurrentNarrativeSceneIfApplicable();
          });
          break;
        }
        self.delegate.widgetsAboveAllScriptIns.sideButtonGroupNode.active = true;
        self.delegate.widgetsAboveAllScriptIns.sideButtonGroupNode.getComponentsInChildren(cc.Layout).forEach(function(layout) {
          layout.updateLayout();
        });
        controller = self._focusOnNode(self.delegate.widgetsAboveAllScriptIns.archiveButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
      break; 
      case targetTutorialGroupData.END:
        const forbidTouch = function(evt) {
          if (evt.target != narrativeSceneScriptIns.transitButton.node) {
            evt.stopPropagation(); 
          } 
        };
        narrativeSceneScriptIns.node.on(cc.Node.EventType.TOUCH_START, forbidTouch, null, true);
        narrativeSceneScriptIns.transitButton.node.getChildByName("Label").getComponent(cc.Label).string = i18n.t("Tutorial.Finish");
        narrativeSceneScriptIns.transitButton.node.once('click', function() {
          narrativeSceneScriptIns.node.off(cc.Node.EventType.TOUCH_START, forbidTouch, null, true);
        });
        break;
      // Display changing of narrator. 
      case 9999:
        narrativeSceneScriptIns.setNarratorSpriteFrame(constants.NARRATOR.SEAGUTS);
        self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
      break;
      case 9998:
        narrativeSceneScriptIns.setNarratorSpriteFrame(constants.NARRATOR.WARRIOR);
        narrativeSceneScriptIns.mirrorNarrativeContainer();
        self._setNarratorPosition(narrativeSceneNode, true);
        self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
      break;
      case 9997:
        narrativeSceneScriptIns.setNarratorSpriteFrame(constants.NARRATOR.FOX);
        self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
      case 9996:
        narrativeSceneScriptIns.setNarratorSpriteFrame(constants.NARRATOR.GIRL);
        narrativeSceneScriptIns.mirrorNarrativeContainer();
        self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
      default:
      break;
    }

    return narrativeSceneNode;
  },

  updateTransitButton(transitBtn, toReplaceBtn) {
    if (transitBtn.getComponent(cc.Sprite) && toReplaceBtn.getComponent(cc.Sprite)) {
      transitBtn.getComponent(cc.Sprite).spriteFrame = toReplaceBtn.getComponent(cc.Sprite).spriteFrame; 
      transitBtn.getComponent(cc.Sprite).sizeMode = toReplaceBtn.getComponent(cc.Sprite).sizeMode; // Note that for cc.Sprite, `sizeMode` must be set before setting the `width` and `height` of the node to function.
    }
    transitBtn.width = toReplaceBtn.width;
    transitBtn.height = toReplaceBtn.height;
    transitBtn.setScale(toReplaceBtn.scale);
    transitBtn.setAnchorPoint(toReplaceBtn.getAnchorPoint());
    const labelNode = transitBtn.getChildByName("Label");
    const animNode = transitBtn.getChildByName("Anim");
    const buttonNode = transitBtn.getChildByName("Button");

    let btnAnim = toReplaceBtn.getChildByName("Anim");
    if (btnAnim) {
      if (btnAnim.getComponent(cc.Sprite)) {
        animNode.getComponent(cc.Sprite).spriteFrame = btnAnim.getComponent(cc.Sprite).spriteFrame; 
        animNode.getComponent(cc.Sprite).sizeMode = btnAnim.getComponent(cc.Sprite).sizeMode;
      }
      animNode.setAnchorPoint(btnAnim.getAnchorPoint());
      animNode.setPosition(btnAnim.position);
      animNode.setScale(btnAnim.scale);
      animNode.width = btnAnim.width;
      animNode.height = btnAnim.height;
      animNode.getComponent(cc.Animation)._clips = btnAnim.getComponent(cc.Animation)._clips; 
      animNode.getComponent(cc.Animation)._defaultClip = btnAnim.getComponent(cc.Animation)._defaultClip; 
      animNode.getComponent(cc.Animation).play(); 
    }
  
    let button = toReplaceBtn.getChildByName("Button");
    if(button){
      if(button.getComponent(cc.Sprite)){
        buttonNode.getComponent(cc.Sprite).spriteFrame = button.getComponent(cc.Sprite).spriteFrame;
        buttonNode.getComponent(cc.Sprite).sizeMode = button.getComponent(cc.Sprite).sizeMode;
      }
      buttonNode.setAnchorPoint(button.getAnchorPoint());
      buttonNode.setPosition(button.position);
      buttonNode.setScale(button.scale);
      buttonNode.width = button.width;
      buttonNode.height = button.height;
    } 

    let btnLabel = toReplaceBtn.getChildByName("label");
    if(!btnLabel){
      btnLabel =  toReplaceBtn.getChildByName("Label");
    }
    if(!btnLabel){
      labelNode.getComponent(cc.Label).string = "";
      return;
    }
    labelNode.setAnchorPoint(btnLabel.getAnchorPoint());
    labelNode.setPosition(btnLabel.position);
    labelNode.width = btnLabel.width;
    labelNode.height = btnLabel.height;
    labelNode.getComponent(cc.Label).string = btnLabel.getComponent(cc.Label).string;
    labelNode.getComponent(cc.Label).font = btnLabel.getComponent(cc.Label).font;
    labelNode.getComponent(cc.Label).fontSize = btnLabel.getComponent(cc.Label).fontSize;
    labelNode.getComponent(cc.Label).fontFamily = btnLabel.getComponent(cc.Label).fontFamily;
    labelNode.getComponent(cc.Label).lineHeight = btnLabel.getComponent(cc.Label).lineHeight;
    labelNode.getComponent(cc.Label).overflow = btnLabel.getComponent(cc.Label).overflow;
  
  },

  onLoad() {
    this.hiddenTransiteButtonPool = new cc.NodePool();
    this.currentNarrativeSceneNode = null;
  },

  update() {},

  onHeadquarterCardClicked(evt, theHqCardScriptIns) {
    const self = this;
    theHqCardScriptIns.statelessBuildableInstanceCardListScriptIns.onCloseClicked(evt);
    self.delegate.endCurrentNarrativeSceneIfApplicable(); 
  },

  _onSnackCardClicked(evt, theSnackCardScriptIns) {
    const self = this;
    theSnackCardScriptIns.statelessBuildableInstanceCardListScriptIns.onCloseClicked(evt);
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _onTowerCardClicked(evt, theCardScriptIns) {
    const self = this;
    theCardScriptIns.statelessBuildableInstanceCardListScriptIns.onCloseClicked(evt);
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _onFarmlandCardClicked(evt, theFarmlandCardScriptIns) {
    const self = this;
    theFarmlandCardScriptIns.statelessBuildableInstanceCardListScriptIns.onCloseClicked(evt);
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _onHqEndedPositioning(evt, statefulBuildableInstance) {
    const self = this;
    const res = self.delegate.onConfirmBuildButtonClicked(true);
    if (false == res) {
      return;
    }
    self._endPositioningStatefulBuildableInstance(statefulBuildableInstance);
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _onStageGoalQuestRead(evt) {
    this.delegate.stageGoalQuestListNode.active = false;
    safelyAssignParent(this.delegate.stageGoalQuestListNode, this.delegate.widgetsAboveAllNode); 
  },

  _onFirstSnackEndedPositioning(evt, statefulBuildableInstance) {
    const self = this;
    const res = self.delegate.onConfirmBuildButtonClicked(true);
    if (false == res) {
      return;
    }
    self._endPositioningStatefulBuildableInstance(statefulBuildableInstance);
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _onTowerEndedPositioning(evt, statefulBuildableInstance) {
    const self = this;
    const res = self.delegate.onConfirmBuildButtonClicked(true);
    if (false == res) {
      return;
    }
    self._endPositioningStatefulBuildableInstance(statefulBuildableInstance);
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _onFirstFarmlandEndedPositioning(evt, statefulBuildableInstance) {
    const self = this;
    const res = self.delegate.onConfirmBuildButtonClicked(true);
    if (false == res) {
      return;
    }
    self._endPositioningStatefulBuildableInstance(statefulBuildableInstance);
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _onHqBuilt(targetedHqInstance, progressBarNodeContainer) {
    const self = this;
    if (null != progressBarNodeContainer) {
      let buildOrProgressBarScriptIns = targetedHqInstance._progressInstanceNode.getComponent('BuildOrUpgradeProgressBar');
      progressBarNodeContainer.removeFromParent();
      safelyAssignParent(targetedHqInstance._progressInstanceNode, targetedHqInstance.node);
      targetedHqInstance.enableBoostButton();
    }
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _onFirstFarmlandBuilt(targetedFarmlandInstance, progressBarNodeContainer) {
    const self = this;
    if (null != progressBarNodeContainer) {
      let buildOrProgressBarScriptIns = targetedFarmlandInstance._progressInstanceNode.getComponent('BuildOrUpgradeProgressBar');
      progressBarNodeContainer.removeFromParent();;
      safelyAssignParent(targetedFarmlandInstance._progressInstanceNode, targetedFarmlandInstance.node);
      targetedFarmlandInstance.enableBoostButton();
    }
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _onFirstSnackBuilt(targetedSnackInstance, progressBarNodeContainer) {
    const self = this;
    if (null != progressBarNodeContainer) {
      let buildOrProgressBarScriptIns = targetedSnackInstance._progressInstanceNode.getComponent('BuildOrUpgradeProgressBar');
      progressBarNodeContainer.removeFromParent();;
      safelyAssignParent(targetedSnackInstance._progressInstanceNode, targetedSnackInstance.node);
      targetedSnackInstance.enableBoostButton();
    }
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _onTowerBuilt(targetedStatefulBuildableInstance, progressBarNodeContainer) {
    const self = this;
    if (null != progressBarNodeContainer) {
      let buildOrProgressBarScriptIns = targetedStatefulBuildableInstance._progressInstanceNode.getComponent('BuildOrUpgradeProgressBar');
      progressBarNodeContainer.removeFromParent();;
      safelyAssignParent(targetedStatefulBuildableInstance._progressInstanceNode, targetedStatefulBuildableInstance.node);
      targetedStatefulBuildableInstance.enableBoostButton();
    }
    self.delegate.endCurrentNarrativeSceneIfApplicable();
  },

  _focusOnNode(node, clickCallback, showFinger) {
    const self = this;
    const narrativeSceneNode = self.currentNarrativeSceneNode; 
    const narrativeSceneScriptIns = narrativeSceneNode.getComponent("NarrativeScene");
    const widgetsAboveAllScriptIns = self.delegate.widgetsAboveAllScriptIns;
    let button = null, cloneNode = null;
    const calculatePosition = function() {
      if (node == narrativeSceneScriptIns.transitButton.node) {
        if (node.parent == narrativeSceneNode) {
          return node.position;
        }   else {
          return narrativeSceneNode.convertToNodeSpaceAR(
            node.convertToWorldSpaceAR(cc.v2(0, 0))
          );
        }
      } else {
        return widgetsAboveAllScriptIns.node.convertToNodeSpaceAR(node.convertToWorldSpaceAR(cc.v2(0, 0)));
      }
    };

    let position = calculatePosition();
    if (node == narrativeSceneScriptIns.transitButton.node) {
      narrativeSceneScriptIns.showFingerAnimOnTransitButton = false;
      button = narrativeSceneScriptIns.transitButton;
      button.clickEvents = [];
      cloneNode = button.node;
    } else {
      if (node.getComponent(cc.Widget)) {
        node.getComponent(cc.Widget).updateAlignment();
      }
      cloneNode = cc.instantiate(node);
      cloneNode.removeComponent(cc.Widget);
      button = new cc.Node().addComponent(cc.Button);
      setLocalZOrder(button.node, getLocalZOrder(cloneNode) + 1);
      button.node.width = cloneNode.width;
      button.node.height = cloneNode.height;
      button.node.position = cloneNode.position = position;
      
      safelyAssignParent(cloneNode, narrativeSceneNode);
      safelyAddChild(narrativeSceneNode, button.node);
    }

    let targetNode = button.node;

    const forbidTouch = function(evt) {
      if (evt.target != targetNode) {
        evt.stopPropagation(); 
      }  
    };
    
    let touchevents = [
      cc.Node.EventType.TOUCH_START, cc.Node.EventType.TOUCH_MOVE,
      cc.Node.EventType.TOUCH_CANCEL, cc.Node.EventType.TOUCH_END,
    ];

    const boundData = {
      button: button,
      highlightedNode: cloneNode,
      originalNode: node,
      fingerPosition: position,
      refreshPosition: function() {
        try {
          boundData.fingerPosition = calculatePosition();
          if (narrativeSceneScriptIns.transitButton.node != node) {
            button.node.position = cloneNode.position = boundData.fingerPosition;
          }
          narrativeSceneScriptIns.finger.position = boundData.fingerPosition;
        } catch (e) {
        
        }
        
      },
      _resolved: false,
      _binded: false,
      _callback: clickCallback,
      resolve: function(evt) {
        if (!boundData._isValid) {
          return;
        }
        if (boundData._resolved) {
          return;
        }
        boundData._resolved = true;
        boundData.disable();
        if (button != narrativeSceneScriptIns.transitButton) { 
          cloneNode.removeFromParent();
          button.node.removeFromParent();
        }
        if (showFinger) {
          narrativeSceneScriptIns.hideFinger();
        }
        clickCallback && clickCallback.call(self, evt);
      },
      enable() {
        // enable the event listener.
        if (boundData._resolved) {
          return;
        }
        if (boundData._binded) {
          return;
        }
        boundData._binded = true;
        touchevents.forEach(function(ev) {
          narrativeSceneScriptIns.node.on(ev, forbidTouch, null, true);
        })
        const theButtonOnClickHandler = new cc.Component.EventHandler();
        theButtonOnClickHandler.target = self.node;
        theButtonOnClickHandler.component = "NarrativeSceneManager"; 
        theButtonOnClickHandler.handler = "_onFocusedButtonClicked";
        theButtonOnClickHandler.customEventData = boundData;
        button.clickEvents = [theButtonOnClickHandler];
      },
      disable() {
        // disable the event listener.
        boundData._binded = false;
        button.clickEvents = [];
        touchevents.forEach(function(evName) {
          narrativeSceneScriptIns.node.off(evName, forbidTouch, null, true);
        });
      },
      hide() {
        // hide highlightedNode and disable callback.
        boundData._isValid = false;
        boundData.highlightedNode.opacity = 0;
        if (showFinger) {
          narrativeSceneScriptIns.hideFinger();
        }
        self.unschedule(boundData.refreshPosition);
      },
      show() {
        // show highlightedNode and enable callback.
        boundData._isValid = true;
        boundData.highlightedNode.opacity = 255;
        if (showFinger) {
          narrativeSceneScriptIns.playFingerClickAnim(boundData.fingerPosition);
          boundData.refreshPosition();
          self.scheduleOnce(boundData.refreshPosition);
        }
      },
      _isValid: true,
      setTargetNode(node) {
        targetNode = node;
      },
    };
    narrativeSceneScriptIns.hideFinger();
    boundData.show();
    boundData.enable();
    return boundData;
  },

  _onFocusedButtonClicked(evt, controller) {
    const self = this;
    if (null != controller) {
      controller.resolve();
      if (null != self.delegate) {
        self.delegate.playEffectCommonButtonClick();
      }
    }
  },

  _setNarratorPosition(narrativeSceneNode, onTop) {
    const self = this;
    const narrativeSceneScriptIns = narrativeSceneNode.getComponent("NarrativeScene");
    const configure = {
      top: 0.1, bottom: 0.01, isAbsoluteTop: false, isAbsoluteBottom: false,
    };
    const narrativeContainer = narrativeSceneScriptIns.narrativeContainer;
    const totalHeight = self.delegate.widgetsAboveAllScriptIns.node.height;
    let offsetTop, offsetBottom;
    if (onTop) {
      offsetTop = configure.isAbsoluteTop ? configure.top : totalHeight * configure.top;
      narrativeContainer.y = totalHeight / 2 - narrativeContainer.height * (1 - narrativeContainer.anchorY) - offsetTop;
    } else {
      offsetBottom = configure.isAbsoluteBottom ? configure.bottom : totalHeight * configure.bottom;
      narrativeContainer.y = -(totalHeight / 2 - narrativeContainer.height * narrativeContainer.anchorY - offsetBottom);
    }
  },

  _startProducingIngredient(narrativeSceneScriptIns, narrativeSceneNode) {
    const self = this;
    let targetIngredientPageCellIns;

    const originalOnSucceedQueryHandler = self.delegate.produceWithIngredientProgressListPanelIns.onSucceed;
    self.delegate.produceWithIngredientProgressListPanelIns.onSucceed = function() {
      originalOnSucceedQueryHandler && originalOnSucceedQueryHandler.apply(this, arguments);
      self.delegate.produceWithIngredientProgressListPanelIns.getComponentsInChildren(cc.Widget).forEach(function(widget) {
        widget.updateAlignment();
      });
      self.delegate.produceWithIngredientProgressListPanelIns.getComponentsInChildren(cc.Layout).forEach(function(layout) {
        layout.updateLayout();
      });
      self.delegate.produceWithIngredientProgressListPanelIns.onSucceed = originalOnSucceedQueryHandler;
      
      targetIngredientPageCellIns = self.delegate.produceWithIngredientProgressListPanelIns.getIngredientPageCellInsInCurrentPage()[0];
      
      if (null == targetIngredientPageCellIns) {
        console.warn(`Why that I can not find any ingredient???`);
        return;
      }
      self._setNarratorPosition(narrativeSceneNode, false);
      narrativeSceneScriptIns.statement.string = i18n.t("Tutorial.NarrativeStatements.inShop");
      self._focusOnNode(targetIngredientPageCellIns.node, function() {
        self.delegate.tryToProduceIngredient(self.delegate.produceWithIngredientProgressListPanelIns, targetIngredientPageCellIns);
      }, true);
      
    };

    const originalProduceSucceedListener = self.delegate.onProduceIngredientSucceed;
    self.delegate.onProduceIngredientSucceed = function() {
      originalProduceSucceedListener.apply(this, arguments);
      self.delegate.onProduceIngredientSucceed = originalProduceSucceedListener;
      narrativeSceneScriptIns.statement.string = i18n.t("Tutorial.NarrativeStatements.waitForProduceDone");
      self.delegate.produceWithIngredientProgressListPanelIns.getComponentsInChildren(cc.Widget).forEach((widget) => {
        widget.updateAlignment();
      });
      self.delegate.produceWithIngredientProgressListPanelIns.getComponentsInChildren(cc.Layout).forEach((layout) => {
        layout.updateLayout();
      });

      let ingredientProgressList = self.delegate.produceWithIngredientProgressListPanelIns.ingredientProgressList;
      let targetIngredientProgressCell = ingredientProgressList.getIngredientProgressCells()[0];
      let controller = self._focusOnNode(targetIngredientProgressCell.node, function() {
        narrativeSceneScriptIns.statement.string = i18n.t("Tutorial.NarrativeStatements.produceDone");
        self._showCurrentTransitButtion();
        self._focusOnNode(narrativeSceneScriptIns.transitButton.node, function() {
          self.delegate.produceWithIngredientProgressListPanelIns.onCloseClicked(null);
          self.delegate.endPositioningStatefulBuildableInstance(false);
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, true);
      }, false);
      controller.button.interactable = false;

      let highlightedIngredientProgressCell = controller.highlightedNode.getComponent('IngredientProgressCell');

      highlightedIngredientProgressCell.init(targetIngredientProgressCell.mapIns);
      highlightedIngredientProgressCell.setData(targetIngredientProgressCell.ingredientProgress);
      highlightedIngredientProgressCell.useWidgets = false;

      targetIngredientProgressCell.cancelEnabled = highlightedIngredientProgressCell.cancelEnabled = false;
      targetIngredientProgressCell.refresh();
      highlightedIngredientProgressCell.refresh();

      self.delegate.produceWithIngredientProgressListPanelIns.onSucceed = function() {
        self.delegate.produceWithIngredientProgressListPanelIns.onSucceed = originalOnSucceedQueryHandler;
        controller.resolve();
      };
    };

  },

  _startDraggingIngredient(narrativeSceneScriptIns, narrativeSceneNode, ingredientIndex, targetBuildableInstance, statementInIrcorrect) {
    const self = this;
    let targetIngredientPageCellIns = null, controller1 = null, controller2 = null;
    self.delegate.moveCameraToPosition(targetBuildableInstance.node.position.sub(cc.v2(0, self.delegate.widgetsAboveAllNode.height / 4)), 0.3, function() {
      controller2 = self._focusOnNode(targetBuildableInstance.node, null, false);
      controller2.button.node.active = false;
      controller2.disable();
      let currentSkeletalAnimationIns = targetBuildableInstance.getPlayingSkeletalAnimationIns();
      controller2.highlightedNode.opacity = 0;
      targetBuildableInstance._refreshAppearanceResource();
      narrativeSceneScriptIns.scheduleOnce(function() {
        targetBuildableInstance.cloneAnimation(controller2.highlightedNode);
        controller2.highlightedNode.opacity = 255;
      })
      inspect();
      playFingerDragAnim();
    })

    let isDropRight = false, playFingerDragAnim = function() {
      if (null == controller1 || null == controller2) {
        return;
      }
      narrativeSceneScriptIns.highlightBox.width = controller1.highlightedNode.width;
      narrativeSceneScriptIns.highlightBox.height = controller1.highlightedNode.height;
      setLocalZOrder(narrativeSceneScriptIns.highlightBox, getLocalZOrder(controller1.highlightedNode) + 100);
      narrativeSceneScriptIns.playFingerDragAnim(controller1.highlightedNode.position, controller2.highlightedNode.position, 300, 999, true);
    }, stopFingerDragAnim = function() {
      narrativeSceneScriptIns.hideFinger();
    };
    const originalOnSucceedQueryHandler = self.delegate.floatingKnapsackPanelIns.onSucceed;
    const originalOnDraggingIngredient = self.delegate.onDraggingIngredient;
    const originalOnDropIngredient = self.delegate.onDropIngredient;
    const originalDropCallback = self.delegate.onStatefulBuildableReceiveIngredient;
    const originalResultedSucceed = self.delegate.onDropIngredientResultedSucceed;
    const originalOnIngredientAcceptIn = self.delegate.onIngredientAcceptIn;
    const originalDefaultActionsEnabled = self.delegate.floatingKnapsackPanelIns.defaultClickHandler;

    function rollback() {
      self.delegate.floatingKnapsackPanelIns.onSucceed = originalOnSucceedQueryHandler;
      self.delegate.onStatefulBuildableReceiveIngredient = originalDropCallback;
      self.delegate.onDraggingIngredient = originalOnDraggingIngredient;
      self.delegate.onDropIngredient = originalOnDropIngredient;
      self.delegate.onDropIngredientResultedSucceed = originalResultedSucceed;
      self.delegate.onIngredientAcceptIn = originalOnIngredientAcceptIn;
      self.delegate.floatingKnapsackPanelIns.defaultClickHandler = originalDefaultActionsEnabled;
      self.delegate.floatingKnapsackPanelIns.closeBtn.node.active = true;
    }

    function inspect() {
      self.delegate.floatingKnapsackPanelIns.closeBtn.node.active = false;
      self.delegate.floatingKnapsackPanelIns.defaultClickHandler = false;
      
      self.delegate.onIngredientAcceptIn = function(statefulBuildableInstance, statefulBuildableIngredientAcceptorIns) {
        if (statefulBuildableInstance == targetBuildableInstance) {
          originalOnIngredientAcceptIn.apply(this, arguments);
        }
      };
      
      self.delegate.onDropIngredientResultedSucceed = function() {
        originalResultedSucceed.apply(this, arguments);
        rollback();
        controller2.resolve();
        self.delegate.floatingKnapsackPanelIns.onCloseClicked(null);
        self.delegate.endCurrentNarrativeSceneIfApplicable();
      };

      self.delegate.onDropIngredient = function() {
        originalOnDropIngredient.apply(this, arguments);
        narrativeSceneScriptIns.maskLayer.active = true;
        if (isDropRight) {
          controller1.resolve();
          controller2.highlightedNode.opacity = 255;
          controller2.enable();
          stopFingerDragAnim();
        } else {
          controller1.highlightedNode.active = true;
          controller2.highlightedNode.opacity = 255;
          playFingerDragAnim();
        }
      };

      self.delegate.onDraggingIngredient = function() {
        originalOnDraggingIngredient.apply(this, arguments);
        narrativeSceneScriptIns.maskLayer.active = false;
        controller1.highlightedNode.active = false;
        controller2.highlightedNode.opacity = 0;
        stopFingerDragAnim();
      };

      self.delegate.onStatefulBuildableReceiveIngredient = function(ingredientCell, statefulBuildableInstance, statefulBuildableIngredientAcceptorIns) {
        if (ingredientCell != targetIngredientPageCellIns || statefulBuildableInstance != targetBuildableInstance) {
          narrativeSceneScriptIns.statement.string = statementInIrcorrect;
          self.delegate.floatingKnapsackPanelIns.show();
        } else {
          originalDropCallback.apply(this, arguments);
          isDropRight = true;
        }
      };
    }

    self.delegate.floatingKnapsackPanelIns.onSucceed = function() {
      originalOnSucceedQueryHandler.apply(this, arguments);
      self.delegate.floatingKnapsackPanelIns.getComponentsInChildren(cc.Widget).forEach((widget) => {
        widget.updateAlignment();
      });
      self.delegate.floatingKnapsackPanelIns.getComponentsInChildren(cc.Layout).forEach((layout) => {
        layout.updateLayout();
      })
      targetIngredientPageCellIns = self.delegate.floatingKnapsackPanelIns.getIngredientPageCellInsInCurrentPage()[ingredientIndex];
      if (null == targetIngredientPageCellIns) {
        console.warn(`Why that I can not find and ingredient???`);
        return;
      }
      controller1 = self._focusOnNode(targetIngredientPageCellIns.node, null, false);
      controller1.button.node.active = false;
      controller1.setTargetNode(targetIngredientPageCellIns.node);
      controller1.highlightedNode.getComponent('IngredientCell').enabled = false;
      playFingerDragAnim();
    };
    
  },

  _showStatelessCardToClick(narrativeSceneNode, buildableId, handler) {
    const self = this;
    const narrativeSceneScriptIns = narrativeSceneNode.getComponent("NarrativeScene");
    let fakeStatelessBuildableInstanceCardListNode = cc.instantiate(this.delegate.statelessBuildableInstanceCardListPrefab);
    fakeStatelessBuildableInstanceCardListNode.setPosition(0, -400);

    let fakeStatelessBuildableInstanceCardListScriptIns = fakeStatelessBuildableInstanceCardListNode.getComponent("StatelessBuildableInstanceCardList"); 

    let buildableIdOnlyStatelessBuildableInstanceList  = [];
    for (let singleStatelessBuildableInstance of this.delegate.statelessBuildableInstanceList) {
      if (singleStatelessBuildableInstance.id != buildableId) {
        continue;
      }
      buildableIdOnlyStatelessBuildableInstanceList.push(singleStatelessBuildableInstance);
    }
    fakeStatelessBuildableInstanceCardListScriptIns.refreshStatelessBuildableInstanceCardListNode(this.delegate, buildableIdOnlyStatelessBuildableInstanceList, null);
    fakeStatelessBuildableInstanceCardListScriptIns.disableCloseButtonOnce();

    let buildRequireGold = buildableIdOnlyStatelessBuildableInstanceList[0].levelConfs.find(function(x) {return x.level == 1;}).buildingOrUpgradingRequiredGold;
    if (self.delegate.wallet.gold < buildRequireGold) {
      self.delegate.widgetsAboveAllScriptIns.walletInfo.setData({
        gold: buildRequireGold,
      });
    }
    fakeStatelessBuildableInstanceCardListScriptIns.refreshDynamicGUI();

    let theCardScriptIns = fakeStatelessBuildableInstanceCardListScriptIns.statelessBuildableInstanceCardScriptInsList[0]; 

    const theCardOnClickHandler = new cc.Component.EventHandler();
    theCardOnClickHandler.target = this.node;
    theCardOnClickHandler.component = "NarrativeSceneManager"; 
    theCardOnClickHandler.handler = handler;
    theCardOnClickHandler.customEventData = theCardScriptIns;
    const hideFingerHandler = new cc.Component.EventHandler();
    hideFingerHandler.target = narrativeSceneNode;
    hideFingerHandler.component = "NarrativeScene"; 
    hideFingerHandler.handler = "hideFinger";
    hideFingerHandler.customEventData = theCardScriptIns;
    theCardScriptIns.clickableArea.clickEvents = [
      theCardOnClickHandler,
      hideFingerHandler,
    ];
    const widgetsAboveAllNode = this.delegate.widgetsAboveAllNode; 
    fakeStatelessBuildableInstanceCardListScriptIns.onShowed = function() {
      const position = fakeStatelessBuildableInstanceCardListNode.position.add(cc.v2(0.5*(widgetsAboveAllNode.width - theCardScriptIns.node.width), 0).mul(-1));
      narrativeSceneScriptIns.playFingerClickAnim(position);
    }
    safelyAssignParent(fakeStatelessBuildableInstanceCardListNode, narrativeSceneNode);
  },

  _startPositioningNewStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    const narrativeSceneNode = self.currentNarrativeSceneNode;
    if (null == narrativeSceneNode) {
      console.warn(`Why I can not find a narrativeSceneNode here?`);
      return;
    }
    const narrativeSceneScriptIns = narrativeSceneNode.getComponent("NarrativeScene");
    statefulBuildableInstance._refreshPlayingFingerFn = function() {
      if (self.delegate.isHighlightingStatefulBuildableInstanceInBarriers()) {
        narrativeSceneScriptIns.showFingerAnimOnTransitButton = false;
        narrativeSceneScriptIns.transitButton.node.getComponentsInChildren(cc.Sprite).forEach(function(sprite) {
          const GraySpriteMaterial = cc.Material.getBuiltinMaterial('2d-gray-sprite');
          sprite.setMaterial(0, GraySpriteMaterial);
        });
        narrativeSceneScriptIns.hideFinger();
      } else {
        narrativeSceneScriptIns.showFingerAnimOnTransitButton = true;
        narrativeSceneScriptIns.transitButton.node.getComponentsInChildren(cc.Sprite).forEach(function(sprite) {
          const SpriteMaterial = cc.Material.getBuiltinMaterial('2d-sprite');
          sprite.setMaterial(0, SpriteMaterial);
        });
        if (!narrativeSceneScriptIns.isPlayingFingerAnimation()) {
          narrativeSceneScriptIns.playFingerClickAnim(narrativeSceneScriptIns.transitButton.node.position);
        }
      }
    }
    statefulBuildableInstance.node.on(cc.Node.EventType.POSITION_CHANGED, statefulBuildableInstance._refreshPlayingFingerFn);
    narrativeSceneScriptIns.showFingerAnimOnTransitButton = false;
    self.scheduleOnce(function() {
      statefulBuildableInstance._refreshPlayingFingerFn();
    })
  },

  _endPositioningStatefulBuildableInstance(statefulBuildableInstance) {
    const self = this;
    statefulBuildableInstance.node.off(cc.Node.EventType.POSITION_CHANGED, statefulBuildableInstance._refreshPlayingFingerFn);
    statefulBuildableInstance._refreshPlayingFingerFn = null;
  },

  _spawnOrderingNpcSingleton() {
    const self = this;
    if (self.targetOrderingNpcNode != null) {
      return self.targetOrderingNpcIns;
    }
    const mapIns = self.delegate;
    const npcNode = cc.instantiate(mapIns.statefulBuildableOrderingNpcPrefab);
    const npcScriptIns = npcNode.getComponent("StatefulBuildableOrderingNpc");
    
    self.targetOrderingNpcNode = npcNode;
    self.targetOrderingNpcIns = npcScriptIns;

    npcScriptIns.speciesName = constants.NPC_ANIM.NAME.HAT_GIRL;
    npcScriptIns.mapNode = mapIns.node;
    npcScriptIns.mapIns = mapIns;
    npcScriptIns.boundStatefulBuildable = null;
    npcScriptIns.homePosInMapNode = null;
    npcScriptIns.targetChair = null;
    npcScriptIns.speed = constants.SPEED.ORDERING_NPC_IN_TUTORIAL;
    safelyAddChild(mapIns.node, npcNode);
    setLocalZOrder(npcNode, window.CORE_LAYER_Z_INDEX.PLAYER);

    self.delegate.statefulBuildableOrderingNpcScriptInsDict[npcScriptIns.node.uuid] = npcScriptIns;

    return npcScriptIns;
  },

  _spawnEscapingAttackingNpc(chosenGrandSrc, chosenTargetPos, speciesName) {
    const self = this;
    const originalOnFledCb = self.delegate.onEscapingAttackingNpcFled.bind(self.delegate);
    const originalUpdate= self.delegate.update.bind(self.delegate);

    self.delegate.onEscapingAttackingNpcFled = (npcScriptIns) => {
      originalOnFledCb(npcScriptIns);
      const actionSeq = cc.sequence([
        self.delegate.mainCameraNode.runAction(cc.moveTo(0.5, cc.v2(0, 0))),
        cc.callFunc(() => {
          self.delegate.update = originalUpdate;
          self.delegate.onEscapingAttackingNpcFled = originalOnFledCb;
          self.delegate.endCurrentNarrativeSceneIfApplicable();
        }, self)
      ]);
      self.delegate.mainCameraNode.runAction(actionSeq);
    };

    self.delegate.moveCameraToPosition(chosenGrandSrc /* coordinate on MapNode, this is a trick to avoid coord transformation */, 0.5, () => {
        const targetedNpc = self.delegate.spawnEscapingAttackingNpc(chosenGrandSrc, chosenTargetPos, speciesName);
        targetedNpc.speed = 600; // Hardcoded temporarily, slightly faster than usual.-- YFLu, 2019-10-23.
        self.delegate.pause();
        targetedNpc.restartFollowing(); // To make the new "targetedNpc.speed" effective.  
        self.delegate.resume();
        self.delegate.update = (dt) => {
          if (null != targetedNpc.node && null != targetedNpc.node.position) {
            self.delegate.mainCameraNode.setPosition(targetedNpc.node.position);
            originalUpdate(dt);
          }
        };
    });

  },


  _mapNodePosToWidgetsAboveAllPos(mapNodePos) {
    const self = this;
    const cameraPosOnMap = self.delegate.mainCameraNode.position;
    const diffVecToTrans = mapNodePos.sub(cameraPosOnMap);  
    const diffVecToRet = diffVecToTrans.mul(self.delegate.mainCamera.zoomRatio); 
    return diffVecToRet;
  },

});
