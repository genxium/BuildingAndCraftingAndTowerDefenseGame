const CloseableDialog = require('./CloseableDialog');
const BuildableWithCount = require('./BuildableWithCount');
const i18nExtends = require('./modules/i18n-extends');
const i18nCompiler = new i18nExtends('StatefulBuildableChangeConfirmationPanel');

cc.Class({
  extends: CloseableDialog,

  properties: {
    titleLabel: {
      type: cc.Label,
      default: null,
    },
    activeAppearanceSprite: {
      type: cc.Sprite,
      default: null,
    },
    displayNameLabel: {
      type: cc.Label,
      default: null,
    },
    requiredTimeLabel: {
      type: cc.Label,
      default: null,
    },
    diffInfoListNode: {
      type: cc.Node,
      default: null,
    },
    unlockBuildableListNode: {
      type: cc.Node,
      default: null,
    },
    confirmButton: {
      type: cc.Button,
      default: null,
    },
    confirmButtonLabel: {
      type: cc.Label,
      default: null,
    },
    buildableWithCountPrefab: {
      type: cc.Prefab,
      default: null,
    },
    diffInfoLinePrefab: {
      type: cc.Prefab,
      default: null,
    },
    unlockIngredientContainer: {
      type: cc.Node,
      default: null,
    },
    unlockIngredientListNode: {
      type: cc.Node,
      default: null,
    },
    ingredientPageCellPrefab: cc.Prefab,
    unlockIngredientListTipLabel: cc.Label,
  },

  init(mapIns, statefulBuildableInstance) {
    const self = this;
    self.mapIns = mapIns;
    self.statefulBuildableInstance = statefulBuildableInstance;
    let mapNode = mapIns.node;
    
    // Initialization of the `confirmButton` [begins].
    self.confirmButton.node.on('click', function() {
      const newLevel = self.mapIns.editingStatefulBuildableInstance.currentLevel + 1;
      self.mapIns.playEffectCommonButtonClick();
      self.mapIns.costGoldForBuildOrUpgradeBuildableInstance(
        self.mapIns.editingStatefulBuildableInstance,
        newLevel,
        function() {
          self.mapIns.clearPanels();
          self.mapIns.upgradeStatefulBuildableInstance(self.mapIns.editingStatefulBuildableInstance);
        }
      ); 
    });
    // Initialization of the `confirmButton` [ends].
  },

  render(activeAppearance, levelConf, diffMap, unlockBuildables) {
    const self = this;
    
    self.titleLabel.string = i18nCompiler.render('title', { level: levelConf.level });

    const displayName = self.statefulBuildableInstance.displayName;
    self.displayNameLabel.string = new i18nExtends('BuildingInfo.DisplayName').render(displayName);

    self.bindingData = {
      activeAppearance, levelConf, diffMap, unlockBuildables, displayName,
    };

    self.activeAppearanceSprite.spriteFrame = activeAppearance;

    self.requiredTimeLabel.string = secondsToNaturalExp(levelConf.buildingOrUpgradingDuration, true);

    self.diffInfoListNode.removeAllChildren();
    self.diffInfoListNode.active = null == diffMap.keys ? !!Object.keys(diffMap).length : 0 < diffMap.keys.length;
    if (diffMap.keys) {
      for (let field of diffMap.keys) {
        let diff = diffMap[field];
        if (null == diff) {
          continue;
        }
        let node = cc.instantiate(self.diffInfoLinePrefab);
        let cpn = node.getComponent('DiffInfoLine');
        if (cpn.render(field, diff)) {
          safelyAddChild(self.diffInfoListNode, node);
        }
      }
    } else {
      for (let field in diffMap) {
        // TODO: i18n
        let diff = diffMap[field];
        let node = cc.instantiate(self.diffInfoLinePrefab);
        let cpn = node.getComponent('DiffInfoLine');
        cpn.render(field, diff);
        safelyAddChild(self.diffInfoListNode, node);
      }
    }

    self.unlockBuildableListNode.parent.active = !!unlockBuildables.length;
    self.unlockBuildableListNode.removeAllChildren();
    unlockBuildables.forEach((buildableInfo) => {
      let node = cc.instantiate(self.buildableWithCountPrefab);
      let cpn = node.getComponent('BuildableWithCount');
      safelyAddChild(self.unlockBuildableListNode, node);
      // node.width = node.height = constants.SIZE.BUILDABLE_WITH_COUNT;
      cpn.render(buildableInfo.appearance, buildableInfo.count, buildableInfo.level);
    });

    self.confirmButtonLabel.string = levelConf.buildingOrUpgradingRequiredGold;
    if (self.mapIns.wallet.gold >= levelConf.buildingOrUpgradingRequiredGold) {
      self.confirmButtonLabel.node.color = cc.Color.WHITE;
    } else {
      self.confirmButtonLabel.node.color = cc.Color.RED;
    }

  },

  renderUnlockIngredientList(unlockIngredients, isProducibleIngredient) {
    const self = this;
    if (!unlockIngredients.length) {
      self.unlockIngredientContainer.active = false;
      return;
    } else {
      self.unlockIngredientContainer.active = true;
    }
    self.unlockIngredientListTipLabel.string = i18nCompiler.render(isProducibleIngredient ? 'unlockIngredientTip' : 'unlockRecipeTip');
    self.unlockIngredientListNode.removeAllChildren();
    unlockIngredients.forEach(function(ingredient) {
      let ingredientPageCellNode = cc.instantiate(self.ingredientPageCellPrefab);
      let ingredientPageCellIns = ingredientPageCellNode.getComponent('IngredientCell');
      ingredientPageCellIns.init(self.mapIns);
      ingredientPageCellIns.setData(ingredient, { ingredient: true });
      ingredientPageCellIns.refresh();
      safelyAddChild(self.unlockIngredientListNode, ingredientPageCellNode);
    });
  },

});
