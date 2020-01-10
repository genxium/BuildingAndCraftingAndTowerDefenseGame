const KnapsackPanel = require('./KnapsackPanel'), PageViewCtrl = require('./PageViewCtrl');

cc.Class({
  extends: KnapsackPanel,
  properties: {
    cellDragable: {
      default: false,
      visible: false,
      override: true,
    },
    pageCellCount: {
      default: 9,
      override: true,
    },
    pageViewScrollEnabled: {
      default: true,
      visible: false,
      override: true,
    },
    isPageCategoried: {
      default: true,
      visible: false,
      override: true,
    },
    defaultClickHandler: {
      default: true,
      override: true,
    },
    ingredientPageViewCtrl: PageViewCtrl,
    categoryPageView: cc.PageView,
  },

  init(mapIns) {
    const self = this;
    self.category = [constants.STATELESS_BUILDABLE_ID.FARMLAND, constants.STATELESS_BUILDABLE_ID.BAKERY, constants.STATELESS_BUILDABLE_ID.LABORATORY];
    KnapsackPanel.prototype.init.call(self, mapIns);
    // Initialization of PageEvent [begin].
    let pageTurningEventHandler = new cc.Component.EventHandler();
    pageTurningEventHandler.target = self.node;
    pageTurningEventHandler.component = 'PlayerRecipePanel';
    pageTurningEventHandler.handler = 'onCategoryTurning';
    self.categoryPageView.pageEvents = [
      pageTurningEventHandler
    ];
    // Initialization of PageEvent [end].
  },

  setData(recipeList) {
    const self = this;
    let fakeKnapsackArray = null != recipeList ? recipeList.map((playerRecipe) => {
      return {
        id: -1,
        currentCount: 1,
        ingredient: playerRecipe.targetIngredient,
      };
    }) : self._data;
    self.recipeList = recipeList;
    // Initialization of buildableIdToRecipeIndexesMap [begin].
    self.buildableIdToRecipeIndexesMap = {};
    self.category.forEach(function(buildableId) {
      self.buildableIdToRecipeIndexesMap[buildableId] = self.mapIns.
        filterBuildableIngredientInteractionByBuildableId(buildableId).
        filter(function(interaction) {
          return interaction.type == constants.BUILDABLE_INGREDIENT_INTERACTION.TYPE.SYNTHESIZABLE;
        }).
        map(function(interaction) {
          return interaction.recipeId;
        }).
        reduce(function(arr, recipeId) {
          let index = 0;
          for (let playerRecipe of self.recipeList) {
            if (playerRecipe.recipeId == recipeId) {
              arr.push(index);
              break;
            }
            index++;
          }
          return arr;
        }, []);
    })
    // Initialization of buildableIdToRecipeIndexesMap [end].
    KnapsackPanel.prototype.setData.call(self, fakeKnapsackArray);
  },

  _toCategoryData() {
    const self = this, checkedIndex = self.getCurrentActiveCategory();
    if (null == self._data) {
      return;
    }
    let buildableId = self.category[checkedIndex];
    let recipeListIndexes = self.buildableIdToRecipeIndexesMap[buildableId];
    
    let uniquedIngredientList = [];

    recipeListIndexes.forEach(function(index) {
      if (null == uniquedIngredientList.find(function(knapsackItem) {
          return knapsackItem.ingredient.id == self._data[index].ingredient.id;
        })
      ) {
        uniquedIngredientList.push(self._data[index]);
      } else {
        return;
      }
    });
    self.data = uniquedIngredientList;
    self._refreshCategoryContainer();
  },

  _refreshCategoryContainer() {
    const self = this;
    let offset = null;
    self.categoryContainer.toggleItems.forEach(function(toggle, index) {
      let buildableId = self.category[index];
      let statefulBuildableInstanceList = self.mapIns.getStatefulBuildableInstanceListByBuildableId(buildableId);
      if (statefulBuildableInstanceList.length) {
        toggle.node.active = true;
        let targetStatefulBuildableInstance = statefulBuildableInstanceList[0];
        for (let i = 0; i < statefulBuildableInstanceList.length; i++) {
          if (statefulBuildableInstanceList[i].currentLevel > targetStatefulBuildableInstance.currentLevel) {
            targetStatefulBuildableInstance = statefulBuildableInstanceList[i];
          }
        }
        toggle.node.getComponentsInChildren(cc.Sprite).forEach(function(sprite) {
          sprite.spriteFrame = targetStatefulBuildableInstance.activeAppearance;
        });
      } else {
        toggle.node.active = false;
      }
    })
    self.categoryContainer.toggleItems.forEach(function(toggle, index) {
      let backgroundNode = toggle.node.getChildByName('BackgroundForUnchecked');
      if (backgroundNode != null) {
        backgroundNode.active = !toggle.isChecked;
      }
      if (toggle.isChecked) {
        self.categoryPageView.scrollToPage(index);
      }
    });
  },

  onCategoryCahnged(targetToggle) {
    const self = this;
    self._toCategoryData();
    self.refresh();
  },

  onCategoryTurning() {
    const self = this;
    let targetIndex = self.categoryPageView.getCurrentPageIndex();
    self.categoryContainer.toggleItems[targetIndex].isChecked = true;
  },
  
  refresh() {
    const self = this;
    KnapsackPanel.prototype.refresh.call(self);
    self.ingredientPageViewCtrl.refreshIndex();
    self.getAllIngredientPageCell().forEach(function(ingredientCellIns, index) {
      const buildableId = self.category[self.categoryPageView.getCurrentPageIndex()];
      const buildableRecipeList = self.buildableIdToRecipeIndexesMap[buildableId].map(function(recipeIndex) {
        return self.recipeList[recipeIndex];
      }).filter(function(playerRecipe) {
        return playerRecipe.targetIngredient.id == ingredientCellIns.ingredient.id;
      });
      let recipeTargetIngredientPageCell = ingredientCellIns.getComponent('RecipeTargetIngredientPageCell');
      let targetPlayerRecipe = buildableRecipeList[0];
      let mininumLevel = self.mapIns.getMinimunLevelToSynthesizePlayerRecipe(targetPlayerRecipe, buildableId);
      recipeTargetIngredientPageCell.setData(recipeTargetIngredientPageCell.data, null, targetPlayerRecipe, mininumLevel);
      recipeTargetIngredientPageCell.refresh();
    });
  },

  _defaultClickHandler(evt) {
    const self = this;
    const {ingredientCell, relatedEvent} = evt.detail;
    const buildableId = self.category[self.categoryPageView.getCurrentPageIndex()];
    const buildableRecipeList = self.buildableIdToRecipeIndexesMap[buildableId].map(function(recipeIndex) {
      return self.recipeList[recipeIndex];
    }).filter(function(playerRecipe) {
      return playerRecipe.targetIngredient.id == ingredientCell.ingredient.id;
    });
    self.mapIns.onRecipeTargetIngredientClicked(self, ingredientCell, buildableRecipeList, buildableId);
  },
})
