const i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

const pbStructRoot = require('./modules/buildable_proto_bundle.forcemsg.js');
window.buildableLevelConfStruct = pbStructRoot.mineralchem.BuildableLevelConfStruct;
window.syncDataStruct = pbStructRoot.mineralchem.SyncDataStruct;
window.interruptTutorialMaskStruct = pbStructRoot.mineralchem.InterruptTutorialMask;
window.stageInitialState = pbStructRoot.mineralchem.StageInitialState;

const StageMap = require('./StageMap');

const diamondCount = 9999, starCount = 3;
cc.Class({
  extends: StageMap,

  ctor() {
    this.mapName = 'OfflineStageMap';
    this.stageSelectionName = 'OfflineStageMap';
  },

  onLoad() {
    const self = this;
    console.log("OfflineStageMap.onLoad [begins]");
    if (null == cc.sys.localStorage.getItem('selfPlayer') || '' == cc.sys.localStorage.getItem('selfPlayer')) {
      const selfPlayer = {
        expiresAt: Date.now(),
        playerId: 1,
        intAuthToken: '',
      };
      cc.sys.localStorage.setItem("selfPlayer", JSON.stringify(selfPlayer));
      cc.sys.localStorage.setItem("targetPlayerId",  selfPlayer.playerId);
    }
    cc.loader.loadRes('stage-common', function(err, jsonAsset) {
      const commonStageObj = jsonAsset.json;
      cc.loader.loadRes('stage', function(err, jsonAsset) {
        const specificStageObj = jsonAsset.json;
        window.stageData = calculateEffectiveStageObj(specificStageObj, commonStageObj);
        window.pbEncodedData = window.pbEncodeData(window.stageInitialState, stageData);
        window.decodedStageData = window.pbDecodeData(window.stageInitialState, pbEncodedData);
        window.cachedPlayerStageBindingData = {
          diamond: diamondCount,
          diamondAutoFillCount: 0,
          diamondAutoFillUpperLimit: 30,
          reqSeqNum: Date.now(),
          ret: 1000,
          star: starCount,
          stageList: [
            {
              id: decodedStageData.stageId,
              stageId: decodedStageData.stageId,
              diamondPrice: decodedStageData.diamondPrice,
              starPrice: decodedStageData.starPrice,
              passScore: decodedStageData.passScore,
              ticketPrice: decodedStageData.ticketPrice,
              pbEncodedData: pbEncodedData,
            }
          ],
          playerStageBindingList: [
            {
              PBEncodedSyncData: pbEncodedData,
              highestScore: 0,
              highestStars: 0,
              id: 1,
              playerId: -1,
              stageId: decodedStageData.stageId,
              state: 3,
            } 
          ],
        }
        cc.sys.localStorage.setItem('stage', JSON.stringify({
          diamond: diamondCount,
          index: 1,
          stage: window.cachedPlayerStageBindingData.stageList[0],
          stageBinding: window.cachedPlayerStageBindingData.playerStageBindingList[0],
          stageId: decodedStageData.stageId,
        }));
        StageMap.prototype.onLoad.call(self);
        console.log("OfflineStageMap.onLoad [ends]");
      });
    });
    
  },

  sendStagePlayerBuildableBindingListQuery(queryParam, callback, alwaysCallback) {
    console.log("OfflineStageMap.sendStagePlayerBuildableBindingListQuery [begins]");
    const self = this;
    const res = {
      buildableIngredientInteractionList: [],
      buildableList: [
        {
          "id": 1,
          "type": 1,
          "discreteWidth": 3,
          "discreteHeight": 3,
          "displayName": "Headquarter",
          "autoCollect": 1
        },
        {
          "id": 3,
          "type": 3,
          "discreteWidth": 3,
          "discreteHeight": 3,
          "displayName": "Snack",
          "autoCollect": 0
        },
        {
          "id": 4,
          "type": 4,
          "discreteWidth": 3,
          "discreteHeight": 3,
          "displayName": "Bakery",
          "autoCollect": 0
        },
        {
          "id": 5,
          "type": 5,
          "discreteWidth": 3,
          "discreteHeight": 3,
          "displayName": "Cafe",
          "autoCollect": 0
        },
        {
          "id": 6,
          "type": 6,
          "discreteWidth": 3,
          "discreteHeight": 3,
          "displayName": "Market",
          "autoCollect": 0
        },
        {
          "id": 100,
          "type": 100,
          "discreteWidth": 2,
          "discreteHeight": 2,
          "displayName": "FireTower",
          "autoCollect": 0
        },
        {
          "id": 101,
          "type": 100,
          "discreteWidth": 2,
          "discreteHeight": 2,
          "displayName": "StoneTower",
          "autoCollect": 0
        },
        {
          "id": 102,
          "type": 100,
          "discreteWidth": 3,
          "discreteHeight": 3,
          "displayName": "ThunderTower",
          "autoCollect": 0
        },
        {
          "id": 103,
          "type": 100,
          "discreteWidth": 2,
          "discreteHeight": 2,
          "displayName": "CannonTower",
          "autoCollect": 0
        },
        {
          "id": 200,
          "type": 200,
          "discreteWidth": 3,
          "discreteHeight": 3,
          "displayName": "Fortress",
          "autoCollect": 0
        }
      ],
      diamond: diamondCount,
      exchangeRateOfGoldToDiamond: 100,
      exchangeRateOfTimeToDiamond: 60000,
      ingredientList: [
        {
          "id": 1000,
          "name": "WOLFMAN",
          "priceCurrency": 1,
          "priceValue": 200,
          "baseProductionDurationMillis": 5000,
          "reclaimPriceCurrency": 1,
          "reclaimPriceValue": 100,
          "baseReclaimDurationMillis": 0,
          "category": 1000,
          "residenceOccupation": 1
        },
        {
          "id": 1001,
          "name": "WITCH",
          "priceCurrency": 1,
          "priceValue": 800,
          "baseProductionDurationMillis": 10000,
          "reclaimPriceCurrency": 1,
          "reclaimPriceValue": 500,
          "baseReclaimDurationMillis": 0,
          "category": 1000,
          "residenceOccupation": 2
        },
        {
          "id": 1002,
          "name": "BOWLCUT",
          "priceCurrency": 1,
          "priceValue": 1600,
          "baseProductionDurationMillis": 60000,
          "reclaimPriceCurrency": 1,
          "reclaimPriceValue": 1200,
          "baseReclaimDurationMillis": 10000,
          "category": 1000,
          "residenceOccupation": 5
        },
        {
          "id": 1003,
          "name": "ELFWARRIOR",
          "priceCurrency": 1,
          "priceValue": 1600,
          "baseProductionDurationMillis": 60000,
          "reclaimPriceCurrency": 1,
          "reclaimPriceValue": 1200,
          "baseReclaimDurationMillis": 10000,
          "category": 1000,
          "residenceOccupation": 2
        },
        {
          "id": 1004,
          "name": "ORCWARRIOR",
          "priceCurrency": 1,
          "priceValue": 1600,
          "baseProductionDurationMillis": 60000,
          "reclaimPriceCurrency": 1,
          "reclaimPriceValue": 1200,
          "baseReclaimDurationMillis": 10000,
          "category": 1000,
          "residenceOccupation": 3
        },
        {
          "id": 1005,
          "name": "BIGSHEEP",
          "priceCurrency": 1,
          "priceValue": 1600,
          "baseProductionDurationMillis": 60000,
          "reclaimPriceCurrency": 1,
          "reclaimPriceValue": 1200,
          "baseReclaimDurationMillis": 10000,
          "category": 1000,
          "residenceOccupation": 3
        },
        {
          "id": 1006,
          "name": "SMALLSHEEP",
          "priceCurrency": 1,
          "priceValue": 1600,
          "baseProductionDurationMillis": 60000,
          "reclaimPriceCurrency": 1,
          "reclaimPriceValue": 1200,
          "baseReclaimDurationMillis": 10000,
          "category": 1000,
          "residenceOccupation": 2
        },
      ],
      recipeList: [],
      reqSeqNum: Date.now(),
      ret: 1000,
      stageInitialState: pbEncodedData,
    };
    self._onStagePlayerBuildableBindingListQueryResponded(res);
    console.log("OfflineStageMap.sendStagePlayerBuildableBindingListQuery [ends]");
  },

  sendPlayerStageTerminateQuery(successCb, failCb) {
    const self = this;
    const res = {
      diamond: diamondCount,
      playerStageBinding: window.cachedPlayerStageBindingData.playerStageBindingList[0],
      reqSeqNum: Date.now(),
      ret: 1000,
      star: starCount,
      unlockedPlayerStageBinding: null,
    };
    const score = self.allGoalQuestFulfilled() ? self.calculateScore() : 0;
    const starCount = self.calculateStar(score);
    if (null != window.cachedPlayerStageBindingData) {
      window.cachedPlayerStageBindingData.diamond = res.diamond;
      self.widgetsAboveAllScriptIns.walletInfo.setData({
        diamond: res.diamond,
      });
      window.cachedPlayerStageBindingData.star = res.star;
      if (null != window.cachedPlayerStageBindingData.playerStageBindingList) {
        let targetPlayerStageBinding = window.cachedPlayerStageBindingData.playerStageBindingList.find(function(playerStageBinding) {
          return playerStageBinding.stageId == res.playerStageBinding.stageId;
        });
        if (null != targetPlayerStageBinding) {
          Object.assign(targetPlayerStageBinding, res.playerStageBinding);

          // Warning: StageMap从localStorage中读取数据，数据更新时应重新写入。
          cc.sys.localStorage.setItem('stage', JSON.stringify({
            stageId: self.currentStageId,
            stage: self.stage,
            index: self.stageIndex,
            stageBinding: targetPlayerStageBinding,
            diamond: res.diamond,
          }));
        } else {
          console.warn("Why I can find the target playerStageBinding?");
          window.cachedPlayerStageBindingData = {
            playerStageBindingList: [],
          };
        }
        if (null != res.unlockedPlayerStageBinding) {
          let targetPlayerStageBinding = window.cachedPlayerStageBindingData.playerStageBindingList.find(function(playerStageBinding) {
            return playerStageBinding.stageId == res.unlockedPlayerStageBinding.id;
          });
          if (null != targetPlayerStageBinding) {
            Object.assign(targetPlayerStageBinding, res.unlockedPlayerStageBinding);
          } else {
            window.cachedPlayerStageBindingData.playerStageBindingList.push(res.unlockedPlayerStageBinding);
          }
        }
      }
    }
    successCb && successCb({
      score: score,
      star: starCount,
    });
  },

  tryToStartStageTimer(stageTimeMillis) {
    const self = this;
    if (null != self.stageStartTime) {
      // It has already been started!
      return;
    }
    if (false == self.allMapsFadedIn || false == self.stageGoalPanelDismissed) {
      return;
    }
    self.initAfterAllTutorialStages();
  },
})

