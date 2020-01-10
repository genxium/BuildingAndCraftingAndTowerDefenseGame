/** v1.3.0(build2.0) 03.07(2).2019 **/

'use strict';
if (!window.i18n) {
  window.i18n = {};
}

if (!window.i18n.languages) {
  window.i18n.languages = {};
}

window.i18n.languages['en'] = {
  "Combo": {
    "Prefix": "Combo",
  },
  "ByteDanceGameTitle": "FoodieClans",
  "GameTitle": "FoodieClans",
  "InsufficientResource": {
    "Gold": "Insufficient gold!",
    "Diamond": "Insufficient diamond!",
    "Energy": "Insufficient energy!",
  },
  "Tutorial": {
    "NarrativeStatements": {
      "0": "",
      "1": "Hi, this is \"Sea guts\", your assistant to run this town of food",
      "2": "Here comes your first guest!",
      "3": "She wants a piece of \"Cookie\" and we need a \"Snack\" shop to serve her, let's click this \"Build\" button to start!",
      "4": "Then pick the card of \"Snack\"",
      "5": "Almost there! You can now choose somewhere to place your \"Snack\" shop, don't worry about where it goes perfect, you can change the position anytime afterwards!",
      "6": "Under construction, it's fast please give it several seconds",
      "7": "Now your \"Snack\" shop is ready to serve!",
      "7_1": "Click the \"Cookie\" bubble to deliver",
      "7_2": "Cookie on its way...",
      "8": "She's glad with the food, pick up the payment！",
      "9": "This is our \"Take-Away\", it serves the guests far from town even when you're offline",
      "10": "The revenue from \"Take-Away\" is cached here, take this as your startup fund!",
      "11": "This is your \"Headquarter\", upgrading it will unlock more building for you",
      "12": "Finally, here is an archive for your reference in the future",
      "13": "You're all set now, hands on the town boss!",

      // For TowerDefense stage#1. 
      "17": "近日野外有点骚动，如果让危险人物从这里入侵小镇我们就麻烦了",
      "18": "我们的城防加强还需要一点时间，在此期间请阻止%s名入侵者",
      "19": "来了，如果没有任何防御措施，入侵者会直奔小镇入口的",
      "20": "",
      "21": "建造防御塔来抵抗入侵者吧",
      "22": "点击防御塔的卡片，然后选择你喜欢的位置建造防御塔",
      "23": "点击这个按钮确定防御塔建造的最终位置，注意塔只能建在有标记的地砖上哦",
      "24": "现在入侵者就没这么容易通过了",
      "25": "",
      "26": "看起来你已经上手了，继续守卫我们的小镇吧!",

      // For drop soldier. 
      "35": "These special tiles are where you can drop your soldier!",
      "36": "Try to tap and drop one",
      "37": "He's working on it!",
      "38": "This symbol shows that our target is to destroy 1 \"Fortress\", ",
      "39": "and here comes the \"Fortress\"",
      "40": "Let's move on",
      "41": "Game starts!",

      // For freeorder ingredient learning. 
      "50": "Oops, the ordered dish is not learned yet, but we can do it in the \"Archive\"",
      "51": "Let's start with \"%s\"",
      "51_1": "It takes some tuition fee to learn how to make \"%s\" but it'll be worthy!",
      "52": "Congratulations!",
      "53": "Happy cooking!",
    },
    "Finish": "Done",
    "Next": "Next>",
    "GameStart": "Game starts",
  },
  // write your key value pairs here
  "iconLabel": {
    "mapList": "All restaurants",
    "certificate": "cert",
    "mainMission": "mission",
    "store": "store",
    "notification": "message",
    "currentLimit": "Current Limit: ",
    "attack": "Attack",
  },
  "logout": {
    "title": "logout",
    "tip": "Are you sure to quit the game?",
    "yes": "Quit",
    "no": "Cancel",
  },
  "login": {
    "label": {
      "phone": "phone number",
      "code": "captcha code",
      "getCaptchaCode": "GetCode",
      "login": "Login",
      "anonymousLogin": "Continue anonymously",
    },
    "hint": {
      "phoneInputHint": "Enter phone number",
      "captchaInputHint": "Enter code",
      "enableGameCenterInSystemSettings": "This game needs GameCenter to proceed. Please enable it in \"System -> Game Center\", then come back to continue...",
      "AanonymousPlayerModeHint": 'You are about to continue as an anonymous player.\n  \nThis game recommends logging in by   \"Game Center\" which can be enabled in your phone \"System -> Game Center\", where your game data can be synchronized across all iPhones & iPads with the same account.\n \nAre you sure to proceed?'
    },
    "tips": {
      "LOGOUT": 'Logout',
      "LOGIN_TOKEN_EXPIRED": 'Previous login status expired',
      "PHONE_COUNTRY_CODE_ERR": 'Incorrect phone country code',
      "CAPTCHA_ERR": 'Incorrect format',
      "PHONE_ERR": 'Incorrect phone number format',
      "SMS_CAPTCHA_FREQUENT_REQUIRE": 'Request too often',
      "SMS_CAPTCHA_NOT_MATCH": 'Incorrect verification code',
      "TEST_USER": 'test account',
      "INCORRECT_PHONE_NUMBER": 'Incorrect phone number',
      "LOGGED_IN_SUCCESSFULLY": "Logged in successfully, please wait...",

      "PLEASE_AUTHORIZE_WECHAT_LOGIN_FIRST": "Please tap the login button to authorize WeChat login first",
      "WECHAT_AUTHORIZED_AND_INT_AUTH_TOKEN_LOGGING_IN": "WeChat authorized, logging in...",
      "WECHAT_LOGIN_FAILED_TAP_SCREEN_TO_RETRY": "WeChat login failed, tap the login button to retry",
      "AUTO_LOGIN_FAILED_WILL_USE_MANUAL_LOGIN": "",
      "AUTO_LOGIN_1": "Automatically logging in",
      "AUTO_LOGIN_2": "Automatically logging in...",
    },
  },
  "MainMission": {
    "panel": {
      "title": "Missions",
      "viewSubMission": "Check",
      "giftTitle": "Rewards:",
      "progress": "Progress:",
      "awarded": "Awarded",
    },
  },
  "subMission": {
    "panel": {
      "subMissionTitle": "Submission",
      "giftTitle": "Rewards: ",
      "getGift": "Claim Reward",
      "gotGift": "Received",
      "tip": {
        "gotGiftSuccess": "Rewards received successfully, keep on fighting!",
      },
    },
  },
  "bichoiceDialog": {
    "yes": "Yes"
  },
  "tips": {
    nomoreRestaurantToAttack: "Attack fails, no more restaurant to attack!",
    cannotAttatckToTheSameVictim: "Attack fails, cannot attack to the same victim",
    terminateSuccess: "Terminate success!",
    attackSuccess: "Attack success!",
    kickAttackerSuccess: "Kick the attacker success!",
    "collectFail": "Something went wrong, please make sure that you have internet access and try again.",
    "lackOfDiamond": "Insufficient diamond to boost, please get some diamond first!",
    "startWork": {
      "fail": "Something went wrong, please make sure that you have internet access and try again.",
      "success": "The cook is on duty now!"
    },
    "startTutorial": "Start tutorials now!",
    "wait": "please wait",
    "boostSuccess": "Boost success!",
    "generalError": "Something went wrong, please make sure that you have internet access and try again.",
  },

  "PlayerBoostConfirmationPanel": {
    "Title": "Boost",
    "Hint": "Do you want to boost the upgrading?",
    "Yes": "Yes",
    "boostTip": "Boosting will cost ",
  },
  "digits": {
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
  },
  "restaurantLevel": "Level %s",
  "mapLoading": "Loading",
  "progressTip": "",
  "wsConnect": {
    "close": "Something went wrong, please login again.",
    "hasConnected": "WS has connected already",
    "reconnected": "WS has reconnected success",
    "reconnecting": "WS is reconnecting..",
  },
  network: {
    disconnected: "Something went wrong, please make sure that you have internet access and try again.",
    tokenExpired: "The login status has expired. Please log in again.",
  },
  "Certificate": {
    "CannotBuildMore": "There's no more restaurant to be built on the current map!",
  },
  "duration": {
    "days": "%sd",
    "hours": "%sh",
    "minutes": "%sm",
    "seconds": "%ss",
  },
  "durationInNormal": {
    "days": "%s day",
    "hours": "%s hr",
    "minutes": "%s min",
    "seconds": "%s sec",
  },
  "cook": {
    "workTip": "Work",
    "hire": "Hire",
    "finishUpgrade": "Click Me!",
  },
  "upgradeCompletePanel": {
    "title": "Upgrade Completed",
    "energyLabel": "Energy Efficiency: ",
    "goldLabel": "Gold Efficiency: ",
    "seatLabel": "Seat capacity: ",
    "unLockedTip": "You've unlocked  ",
    "noneUnlockedTip": " ",
    "energyUnit": "/guest",
    "goldUnit": "/guest",
  },
  notificationPanel: {
    "currentPageTitle": "Current Page: ",
    "totalPageTitle": "Total: ",
    "delete": "delete",
    "title": "Messages",
    detail: "detail",
  },
  notificationDetailPanel: {
    title: "Message",
  },
  iapPanel: {
    title: "Store",
  },
  errorHint: {
    lackOfGold: "Insufficient gold to proceed.",
    lackOfDiamond: "Insufficient diamond to proceed.",
    unKnown: "Something went wrong, please make sure that you have internet access and try again.",
  },
  Victim: {
    Scout: "Scout",
    Terminate: "Terminate",
    Attack: "Attack",
    Kick: "kick",
    attackerName: "attacker:  ",
    CancelScounting: "Back home",
  },
  CandidateVictimPoolIndicator: {
    view: "View"
  },
  CandidateVictimPoolPanel: {
    title: "Players"
  },
  ToAttackCookIndicator: {
    pick: "Pick"
  },
  ToAttackCookListPanel: {
    title: "Cooks"
  },

  FoodInformationPanel: {
    title: "Food",
    price: "The price: ",
  },

  BuildingInfo: {
    DisplayName: {
      Barn: "Barn",
      Laboratory: "Laboratory",
      Barrack: "Barrack",
      Bakery: "Bakery",
      Headquarter: "Headquarter",
      Restaurant: "Restaurant",
      Farmland: "Farmland",
      Snack: "Snack",
      Market: "Take-Away",
      Cafe: "Cafe",
      IceCreamVan: "Ice-Cream Van",
      Gashapon: "Gashapon",
      FruitStand: "Fruit Stand",
      FireTower: "FireballTower",
      StoneTower: "StoneTower",
      ThunderTower: "ThunderTower",
      CannonTower: "CannonTower",

      Fortress: "Fortress",
    },
    Short: "%s (Lv%s)",
    Lv: "Lv%d",
  },

  StatefulBuildableInstanceInfoPanel: {
    Level: "Lv",
    MAX_LEVEL: "Level Max",
    Info: {
      Headquarter: 'Headquarter is the heart of your village. Upgrading your Headquarter unlocks new buildings and ingredients, which brings you extraordinary game experience.',
      Restaurant: 'You can sell the foods or ingredients in the restaurant. After a while, the restaurant will finish the bill and you can collect your gold then.',
      Laboratory: "In the Laboratory, you can craft the ingredients to create new food according to the recipe you have. Once succeeded, you can quickly produce foods in specific buildings. That will help you to save a lot of time.",
      Barrack: "The Barrack allows you to train troops to attack your enemies. Upgrade the Barrack to unlock advanced units that can win epic battles.",
      Bakery: "The Bakery is used for producing delicious food. Upgrading the bakery, you can obtain more secret recipes.",
      Farmland: "The Farmland produces ingredients by planting the seed. Sometimes ingredient itself can be the seed.",
      Snack: "Snack",
      Market: "Take-Away",
      Cafe: "Cafe",
      "IceCreamVan": "Ice-Cream Van",
      "Gashapon": "Gashapon",
      "FruitStand": "Fruit Stand",
      
      FireTower: "This is FireTower.",
      StoneTower: "This is StoneTower.",
      ThunderTower: "This is ThunderTower.",
      CannonTower: "This is CannonTower.",

      Fortress: "This is Fortress.",
    },
    Tip: {
      MaxProgressListLength: {
        Farmland: 'Planting Limit: {length}',
        Restaurant: 'Serving Limit: {length}',
        Bakery: 'Baking Limit: {length}',
      },
    },
  },

  IdleStatefulBuildableInstanceInfoPanel: {
    Level: "Lv",
    MAX_LEVEL: "Level Max",
    Info: {
      Headquarter: 'Headquarter is the heart of your village. Upgrading your Headquarter unlocks new buildings and ingredients, which brings you extraordinary game experience.',
      Snack: 'You can sell the foods or ingredients in the restaurant. After a while, the restaurant will finish the bill and you can collect your gold then.',
      Cafe: "In the Laboratory, you can craft the ingredients to create new food according to the recipe you have. Once succeeded, you can quickly produce foods in specific buildings. That will help you to save a lot of time.",
      Market: "The \"Take-Away\" allows you to gain revenue even when you're offline.",
      Barrack: "The Barrack allows you to train troops to attack your enemies. Upgrade the Barrack to unlock advanced units that can win epic battles.",
      Bakery: "The Bakery is used for producing delicious food. Upgrading the bakery, you can obtain more secret recipes.",
      Farmland: "The Farmland produces ingredients by planting the seed. Sometimes ingredient itself can be the seed.",
      "IceCreamVan": "This is Ice-Cream Van.",
      "Gashapon": "This is Gashapon.",
      "FruitStand": "This is Fruit Stand.",
    },
    Tip: {
      MaxSeatingCapacity: {
        Farmland: '%s',
        Snack: '%s',
        Cafe: '%s',
        Market: '%s',
        Bakery: '%s',
        "IceCreamVan": "%s",
        "Gashapon": "%s",
        "FruitStand": "%s",
      },
      MaxSeatingCapacityPrefix: 'Seating Capacity:',
      residentLimitPrefix: "Resident Limit:",
      producibleIngredientListTip: 'dish',
      purchaseIngredient: 'learn',
      ingredientUnlocked: 'learned',
      ingredientRequirePurchase: 'to learn',
      unlockBuildableToLevel: 'unlock when %s is level %d',
    },
  },

  UpgradeDependencyPanel: {
    title: "Dependency not met",
    titleForReachMaxCount: "Full built already",
    Note: {
      title: "Note!",
      instruction: "To build %s lv%d, the followings are required to build in addition.",
      reachMaxLevel: "No more %s could be built.",
      unlockMoreBuildable: "To build more %s, you should have built the followings.",
    },
  },

  StatefulBuildableChangeConfirmationPanel: {
    title: "Upgrade to lv{level} ?",
    upgradeTip: "Upgrading required",
    unlockTip: "Unlock the buildings",
    unlockIngredientTip: "Unlock dishes",
    unlockRecipeTip: "Unlock recipes",
    requirePurchaseTip: "learnable",
    baseGoldProductionRateTip: "Take-out income",
    perMinutes: "/min",
  },

  Tip: {
    Button: {
      confirm: "Okay",
      cancel: "Cancel",
      build: "Build",
      gameSettings: "settings",
      knapsack: "Knapsack",
      crafting: "Crafting",
      info: "Info",
      upgrade: "Upgrade",
      hqProduction: "Produce",
      labResearch: "Research",
      farmProduction: "Produce",
      bakeryProduction: "Order",
      collect: "Collect",
      boost: "Boost",
      recipe: "Recipe",
      ingredient: "Dish",
      mission: "Mission",
      claimReward: "Claim Rewards",
      quit: "Quit",
      menu: "Menu",
      replay: "Replay",
      backToStageSelection: "Quit",
      yes: "Yes",
      collectCachedGold: "Collect",
      ad: "Ad",
      archive: "Archive",
      achievement: "Rewards",
      combo: "Combo",
      barrack: "Barrack",
      goToBattle: 'Attack!',
      loginAnonymously: 'Play Anonymously',
    },
    goldStorage: "Gold capacity: %s",
    residentLimit: "Troop capacity: %s",
    chairCount: "%s",
    goldProductionRate: "GoldProductionRate: ",
    idleGameGoldProductionRate: "Take-out income: per minute %s",
    Ajax: {
      waiting: "Please wait for response...",
    },
    DropIngredientFailed: {
      title: "Sorry",
      buildable: "Please wait for the (building/upgrading) to complete.",
      recipe: "The ingredient can not be produced.",
      wrongTarget: "The ingredient can not be produced or reclaimed in this building.",
      reclaim: "Failed to reclaim the ingredient.", 
      queueFulled: "The {displayName} is too busy to handle the ingredient.",
    },
    title: "Tip",
    announcementTitle: "Announcement",
    stageRuleTitle: "Rule",
    Upgrade: {
      ingredientProgressListNotEmpty: "There has some ingredient prooducing. You can not upgrade now.",
      mustCollectIngredientProgressList: "There are some ingredients to be collected. Please collect them.", 
    },
    totalDuration: "Total Duration:",
    Recipe: {
      requiredLevel: 'required level: lv{level}',
      consumablesAvailable: 'ready',
      consumablesUnAvailable: 'not ready',
    },
    built: "Built:",
    stageScore: "",
    share: "share",
    additionTip: '+%s',
    additionMinusTip: '-%s',
    rewardObtain: '%s',
    cancelDragging: 'Drag here to cancel Dragging.',
    Category: {
      Ingredient: {
        learned: 'learned',
        unlearned: 'to learn',
      }
    },
    missionHelpTitle: "Help",
    unlockHousekeeperTitle: "Puchase srvice",
    unlockHousekeeper: "Spend %s gold to hire a housekeeper?",
    servingOrderingNpc: "Enjoy it!",
    housekeeperSpeaking: "The housekeeper",
    housekeeperResting: "I am resting.",
    housekeeperOnDuty: "I am working.",
    housekeeperOfflineIncomeTitle: "Welcome back!",
    housekeeperOfflineIncome: "The \"Housekeepers\" gained %s gold when you are offline!",
    marketIncomeTitle: "Take-out income",
    marketIncome: "Your market has earn %s gold for you!",
    boldFont: "<b>%s</b>",
    requiredGoldTooMuch: 'The required gold is too many to store in Headquarter, upgrade the Headquarter to enable it!',
  },

  DiffInfoLine: {
    Tip: {
      chairCount: "%s",
      idleGameGoldProductionRate: "%s/min",
      idleGameFoodProductionRate: "%s",
      goldStorage: "%s",
      goldStorageTitle: "Gold capacity",
      baseGoldProductionRateTitle: "Takeaway income",
      baseFoodProductionRateTitle: "Troop capacity",
      chairCountTitle: "Seat capacity",
    },
  },

  CostDiamondsToBuyGoldPanel: {
    Tip: {
      gold: "Want to buy {goldCount} gold?",
      boost: "Do you want to finish the process immediately?",
      boostNpcBackToWork: "Do you want to boost the npc?",
    },
    Title: {
      gold: "You need more gold!",
      boost: "Boost confirmation",
      boostNpcBackToWork: "Boost confirmation",
    },
  },

  Knapsack: {
    title: "Knapsack",
    toCraftingSystem: "Go to crafting system.",
    emptyHint: "It's empty here, get some from the Headquarter!",
  },

  InBattleSoldier: {
    emptyHint: "",
  },

  CraftingSystem: {
    title: "CraftingSystem",
    Tip: {
      costGold: 'Craft',
      clearAll: 'Clear',
    },
  },

  Ingredient: {
    DisplayName: {
      "wheat seed": "wheat seed",
      "wheat": "wheat",
      "corn seed": "corn seed",
      "corn": "corn",
      "grape": "grape",
      "egg": "egg",
      "sugar": "sugar",
      "bread": "bread",
      "popcorn": "popcorn",
      "donut": "donut",
      "cake": "cake",
      "brandy": "brandy",
      "raspberry": "raspberry",
      "coffee bean": "coffee bean",
      "cookie": "cookie",
      "pudding": "pudding",
      "Espresso": "Espresso",
      "berry Juice": "berry Juice",
      "banana": "banana",
      "milk": "milk",
      "egg toast": "egg toast",
      "corn bread": "corn bread",
      "banana pancake": "banana pancake",
      "icecream": "icecream",
      "latte": "latte",
      "milkshake": "milkshake",
      "cocktail": "cocktail",
      "pineapple": "pineapple",
      "chocolate": "chocolate",
      "cheese": "cheese",
      "chocolate cake": "chocolate cake",
      "chocolate dounut": "chocolate dounut",
      "cheese cake": "cheese cake",
      "fruit pizza": "fruit pizza",
      "Chocolate Popcorn": "Chocolate Popcorn",
      "chocolate icecream": "chocolate icecream",
      "icecream boat": "icecream boat",
      "mixed pancake": "mixed pancake",
      "mocha": "mocha",
      "mixed smoothie": "mixed smoothie",
      "Pina Colada": "pina colada",
      "bacon": "bacon",
      "chips": "potato chips",
      "salad": "salad",
      "springroll": "springroll",
      "hotdog": "hotdog",
      "fried prawn": "fried prawn",
      "papad": "papad",
      "Sussage Muffin with egg": "Sausage muffin",
      "Big Mac": "big Mac",
      "Egg tart": "tart(w/ egg)",
      "Steamed Bun": "steamed bun",
      "Siu Mai": "siu mai",
      "Raspberry Mocha": "raspberry Mocha",
      "Mint Tea": "mint tea",
      "Beer": "beer",
      "Mojito": "Mojito",
      "Rum": "rum",
      "Red wine": "wine",
      "WOLFMAN": "wolfman",
      "BOWLCUT": "bowlcut",
      "WITCH": "witch",
      "locked": "Whooops!!!",
    },
    Description: {
      "wheat seed": "This is a wheat seed. You can plant it in the farmland and grow the wheat. Planting 1 seed yields 1 wheat and takes 5 seconds to mature.",
      "wheat": "Wheat grows in farmland by planting wheat seed or wheat itself.  Planting 1 wheat yields 3 wheats (net gain of 2 wheats) and takes 10 seconds to mature.",
      "corn seed": "This is a corn seed. You can plant it in the farmland and grow the corn. Planting 1 seed yields 1 corn and takes 5 seconds to mature",
      "corn":  "Corn grows in farmland by planting corn seed or corn itself.  Planting 1 corn yields 3 corns (net gain of 2 corns) and takes 10 seconds to mature.",
      "grape": "Grape grows in farmland by planting carrot itself.  Planting 1 grape yields 2 grapes (net gain of 1 grape) and takes 15 seconds to mature.",
      "egg":  "Eggs are supplied from Headquarter. Once ordered, the FedEx needs 3 seconds to deliver an egg.",
      "sugar": "Sugar is supplied from Headquarter. Once ordered, the FedEx needs 3 seconds to deliver a pack of sugar.",
      "bread": "Bread needs to be crafted in the Laboratory. To make bread, 2 wheats are needed and it will take 12 seconds.",
      "popcorn": "Popcorn needs to be crafted in the Laboratory. To make popcorn, 2 corns and 1 sugar are needed and it will take 20 seconds.",
      "donut": "Donut needs to be crafted in the Laboratory. To make donut, 3 wheats and 1 sugar are needed and it will take 30 seconds.",
      "cake": "Cake needs to be crafted in the Laboratory. To make cake, 3 wheats, 1 eggs and 1 sugar are needed and it will take 50 seconds.",
      "brandy": "Brandy needs to be crafted in the Laboratory. To make brandy, 5 wheats and 2 grapes  are needed and it will take 100 seconds.",
      "WOLFMAN": "This is wolfman.",
      "BOWLCUT": "This is bowlcut.",
      "WITCH": "This is witch.",
    },
    Tip: {
      Price: {
        gold: "{value} Gold",
        diamond: "{value} Diamonds",
      },
      Category: {
        crop: "Crop",
        product: "Product",
      },
      RecipeLocked: {
        bread: "Sorry, this recipe is not discovered. To unlock it, you should build a Bakery.",
        popcorn: "Sorry, this recipe is not discovered. To unlock it, you should upgrade your Bakery to level 2.",
        donut: "Sorry, this recipe is not discovered. To unlock it, you should upgrade your Bakery to level 3.",
        cake: "Sorry, this recipe is not discovered. To unlock it, you should upgrade your Bakery to level 4.",
        brandy: "Sorry, this recipe is not discovered. To unlock it, you should upgrade your Bakery to level 5.",
      },
      RequiredCrafted: {
        wheat: "Try to drag a wheat sead or wheat into Farmland",
        corn: "Try to drag  a corn sead or corn into Farmland",
        grape: "Try to drag a grape into Farmland",
        bread: "If you want to make bread in bakery, you have to craft it in the Laboratory.",
        popcorn: "If you want to make popcorn in bakery, you have to craft it in the Laboratory.",
        donut: "If you want to make donut in bakery, you have to craft it in the Laboratory.",
        cake: "If you want to make cake in bakery, you have to craft it in the Laboratory.",
        brandy: "If you want to make brandy in bakery, you have to craft it in the Laboratory.",
      },
      RecipeUnlocked: {
        wheat: "Cool! You can produce wheat in Farmland now.",
        corn: "Cool! You can produce wheat in Farmland now.",
        grape: "Cool! You can produce grape in Farmland now.",
        bread: "Cool! You can produce bread in Bakery now.",
        popcorn: "Cool! You can produce popcorn in Bakery now.",
        donut: "Cool! You can produce donut in Bakery now.",
        cake: "Cool! You can produce cake in Bakery now.",
        brandy: "Cool! You can produce brandy in Bakery now.",
      },
    },
  },

  CraftingResultPanel: {
    Title: {
      waiting: "Crafting...",
      failed: "Crafting Failed!",
      succeed: "Crafting Succeeded!",
      hugeSucceed: "Huge Succeeded!!!",
    },
    Tip: {
      waiting: "Ingredients are crafting...",
      succeed: "Congratulations! You've got a new Food:\n{displayName}",
      Succeed: {
        RecipeKnown: {
          ingredientKnown: "Congratulations! You've crafted a new Food:\n{displayName}",
          ingredientNew: "Congratulations! You've got a new Food:\n{displayName}",
        },
        RecipeNew: {
          ingredientKnown: "Congratulations! You've found a new Recipe to craft ${displayName}!",
          ingredientNew: "Congratulations! You've found a new Recipe and crafted a new Food:\n{displayName}",
        },
        crafting: "Cool, The {displayName} is in production, please wait...",
      },
      failed: "Sorry\nThere's no such recipe.",
    },
  },

  IngredientCellInfoPanel: {
    title: 'Dish Info',
    Tip: {
      price: "Price: ",
      reclaimPrice: "Selling for: ",
      recipe: "Recipe",
      acquiredAt: "Acquired in：",
    },
    Soldier: {
      baseHp: "%s",
      baseDamage: "%s",
      baseSpeed: "%s",
      baseAttackFps: "%s",
      baseDefenderRadius: "%s",
      residenceOccupation: "x%s",
      Tip: {
        baseHp: "hp",
        baseDamage: "damage",
        baseSpeed: "speed",
        baseAttackFps: "attack fps",
        baseDefenderRadius: "defender radius",
      }
    },
  },

  IngredientProgressCell: {
    Tip: {
      pendingInQueue: 'Preparing',
    },
  },

  IngredientProgressList: {
    Tip: {
      empty: 'Click the ingredient to produce.',
      craftingListEmpty: 'Drag&Drop ingredients for Crafting.',
    },
  },

  ProduceWithIngredientProgressListPanel: {
    title: "Shop",
    Tip: {
      reachMaxQueueLength: "The Headquarter is too busy...",
    },
  },

  BarrackPanel: {
    title: "Barrack",
    Tip: {
      empty: "Click the soldier icon to recruit.",
      reachMaxQueueLength: "The barrack is too busy recruiting...",
      troop: "Troop",
      conscription: "Conscription",
      edit: "Edit",
      reclaimedGold: "Reclaimed Gold: ",
      unlockBuildableToLevel: 'unlock when %s is level %d',
      residentLimit: 'Residents: %s/%s',
      residentReachLimat: 'Please build more buildable to get more residence.',
    },
  },

  StatefulBuildableIngredientProgressListPanel: {
    title: "Progress List",
    queueLabel: "{current}/{max}",
  },

  PlayerRecipePanel: {
    title: "Recipe",
  },

  FloatingRecipePanel: {
  
  },

  RecipeBindingPopup: {
    title: 'recipe for {name}',
    Tip: {
      requiredLevel: 'Required Level:\nlv{level}',
      checkRecipe: 'Please make the food according to the recipe in Laboratory first.',
    },
  },

  RecipeInfoPanel: {
    Tip: {
      output: 'Output: ',
    }
  },

  PlayerIngredientPanel: {
    title: 'Dish',
    Tip: {
      unlockBuildableToLevel: 'unlock by {displayName} level {level}',
    },
  },

  PlayerMissionPanel: {
    title: 'Mission',
    Tab: {
      finished: 'Finished',
      unfinished: 'Unfinished',
    },
    Tip: {
      reward: 'Rewards: ',
      progress: 'Progress: {current}/{total}',
      check: 'Check',
    },
  },

  PlayerQuestPanel: {
    title: 'Quest',
    Tip: {
      reward: 'Rewards: ',
      missionNotCompleted: 'whoops,it seems some quests not finished.',
      finished: 'Finished!',
    },
  },

  MissionClaimRewardPanel: {
    title: 'Congratulations',
    Tip: {
      reward: 'Well done！\nThe rewards are yours now.',
    },
  },

  StageSelectionCell: {
    DisplayName: {
      '1': 'Climp up the hill',
      '2': 'To the Elf town',
      '3': 'Fight the Orcs!',
      '4': 'Battle field is cruel',
      '5': 'The turnover',
      '6': 'Symmetry',
      '7': 'Lesson 1 again',
      '8': '',
      '9': '',
      '10': '',
      '11': '',
      'FUTURE_STAGE': 'Coming soon...',
    },
    Tip: {
      index: '%s',
      starPrice: 'Cost ',
      start: 'Start',
      unlock: 'Unlock',
      beginer: 'Beginer',
    },
  },
    
  StageGoal: {
    DefaultHint: "Fulfill the following orders",
    DestroyEnemy: "Targets",
    DefaultForFailingHint: "Avoid the followings",
    Scout: "Scout",
    MyTroop: "My Troop",
    BackToStageSelection: "Back",
  }, 

  StageMenuPanel: {
    title: 'Menu',
  },

  ConfirmationPanel: {
    title: 'Confirmation',
    Tip: {
      replay: 'Are you sure to replay the current level?',
      backToStageSelection: 'Are you sure to quit the current stage?',
      enterCombo: 'Are you sure to spend %s gold to start combo?',
      logout: 'Are you sure to logout?',
    },
  },

  StageResultPanel: {
    title: 'Level {index}',
    Tip: {
      stageScore: 'Score',
      backToStageSelection: 'Back',
      pass: 'Pass!',
      fail: 'Fail!',
      refreshHighestScore: "New record!",
      highestScore: 'Best ever: ', 
    },
  },

  StageSelectionScene: {
    Tip: {
      progress: 'Progress',
      rule: 'For each level, destroy the specified building to gain victory! Yet the more buildings you take down the higher score will come!',
      unlockTitle: 'Unlock level',
      unlock: 'To unlock this stage, the prev stage must be passed.',
      lackOfDiamondTitle: 'Lack of Diamond',
      enterStageMap: 'Cost %s diamonds to start?',
      diamondInfo: 'Autofill:\n%s diamonds.',
    },
  },
  
  IdlePlayerArchivePanel: {
    Tip: {
      unlockBuildableToLevel: 'unlock when %s is level %d',
      dependencyMetNotBuilt: "new",
      building: "Building",
      ingredient: "Dish",
      housekeeper: "Staff",
    }
  },

  IdleIngredientCellInfoPanel: {
    title: 'Dish Info',
    Tip: {
      reclaimPrice: "Selling for",
      baseReclaimDurationMillis: "Production taks",
      acquiredAt: "Selling at \"%s\"",
    },
    Description: {
      "wheat seed": "This is wheat seed.",
      "wheat": "This is wheat.",
      "corn seed": "This is corn seed.",
      "corn": "This is corn.",
      "grape": "This is grape.",
      "egg": "This is egg.",
      "sugar": "This is sugar.",
      "bread": "This is bread.",
      "popcorn": "This is popcorn.",
      "donut": "This is donut.",
      "cake": "This is cake.",
      "brandy": "This is brandy.",
      "raspberry": "This is raspberry.",
      "coffee bean": "This is coffee bean.",
      "cookie": "This is cookie.",
      "pudding": "This is pudding.",
      "Espresso": "This is Espresso.",
      "berry Juice": "This is berry Juice.",
      "banana": "This is banana.",
      "milk": "This is milk.",
      "egg toast": "This is egg toast.",
      "corn bread": "This is corn bread.",
      "banana pancake": "This is banana pancake.",
      "icecream": "This is icecream.",
      "latte": "This is latte.",
      "milkshake": "This is milkshake.",
      "cocktail": "This is cocktail.",
      "pineapple": "This is pineapple.",
      "chocolate": "This is chocolate.",
      "cheese": "This is cheese.",
      "chocolate cake": "This is chocolate cake.",
      "chocolate dounut": "This is chocolate dounut.",
      "cheese cake": "This is cheese cake.",
      "fruit pizza": "This is fruit pizza.",
      "Chocolate Popcorn": "This is Chocolate Popcorn.",
      "chocolate icecream": "This is chocolate icecream.",
      "icecream boat": "This is icecream boat.",
      "mixed pancake": "This is mixed pancake.",
      "mocha": "This is mocha.",
      "mixed smoothie": "This is mixed smoothie.",
      "Pina Colada": "This is Pina Colada.",

      "bacon": "This is bacon",
      "chips": "This is potation chips.",
      "salad": "This is salad.",
      "springroll": "This is springroll.",
      "hotdog": "This is hotdog.",
      "fried prawn": "This is fried prawn.",
      "papad": "This is papad.",
      "Sussage Muffin with egg": "This is sussage muffin(w/ egg).",
      "Big Mac": "This is big mac.",
      "Egg tart": "This is tart(w/ egg).",
      "Steamed Bun": "This is steamed bun.",
      "Siu Mai": "This is siu mai.",
      "Raspberry Mocha": "This is raspberry mocha.",
      "Mint Tea": "This is mint tea.",
      "Beer": "This is beer.",
      "Mojito": "This is mojito.",
      "Rum": "This is rum.",
      "Red wine": "This is wine.",
    },
  },
  StatelessBuildableInstanceInfoPanel: {
    Tip: {
      requiredBuildable: "Required Headquarter lv%s",
      buildingOrUpgradingDuration: "Building duration",
      buildingOrUpgradingRequiredGold: "Building price",
      baseGoldProductionRate: "Take-out income",
      seatingCapacity: "Seating capacity", 
      perMinutes: "/min",
    },
  },

  IdleStatelessBuildableInstanceInfoPanel: {
    Tip: {
      requiredBuildable: "Required Headquarter lv%s",
      buildingOrUpgradingDuration: "Building duration",
      buildingOrUpgradingRequiredGold: "Building price",
      baseGoldProductionRate: "Take-out income",
      goldPerMinute: "Per minute %s",
      seatingCapacity: "Seating capacity", 
      residentLimit: "Troop population", 
      perMinutes: "/min",
    },
  },

  CostGoldConfirmationPanel: {
    title: "Confirmation",
    Tip: {
      unlockIngredientForIdleGame: "Do you want to spend %d gold to unlock this dish?",
    },
  },

  PlayerAchievementPanel: {
    Tip: {
      achievement: "Achievement",
      dailyMission: "Daily run",
      refreshDailyMission: "%s",
      goToArchivePanelForIngredient: "Unlock any \"Dish\" in the \"Archive\"!",
      goToArchivePanelForBuildable: "The \"Archive\" has a collection of buildables for you!",
    },
  },

  PlayerAchievementCell: {
    Tip: {
      questProgress: '%d/%d',
      obtainReward: 'take',
      inProgress: 'ongoing...',
      completed: '',
    }
  },

  ComboScorePanel: {
    title: "Congrat!",
    Tip: {
      maxCulmulatedCount: "Highest hits ever: %s",
      currentCulmulatedCount: "==Highest hits==",
      culmulatedGoldCount: "income",
      reward: "rewards",
    },
  },

  ComboGoalPanel: {
    title: "Combo",
    Tip: {
      rule: 'We\'ll bring a bunch of guests for you in 30s,\nserve them in a combo for rewards!',
      info: '*only highest hits of a round will be rewarded',
      rewardLessThan: 'for no more than %s hits',
      rewardLargeThan: "more than %s hits",
    },
  },

  CollectCachedGoldConfirmationPanel: {
    title: "Glad to see you",
    Tip: {
      confirmation: "collect",
    },
  },

  VideoAd: {
    Button: {
      startCombo: "Watch video to start",
      gainDiamond: "",
      gainGold: "Gold x2",
    },
    Error: {
      NoFill: "Seems like there's no appropriate ads at the moment, please try again later ^_^",
    },
    Tip: {
      startCombo: "Oops, seems like the video didn't complete correctly",
      gainDiamond: "Oops, to gain %s diamonds the video has to complete playing",
      gainDiamondRichText: "Watch video to gain %s diamonds!<br/><img src='Icon_LargeDiamondPackage' />",
      gainGold: "Oops, seems like the video didn't complete correctly",
    },
    Title: {
      gainDiamond: "Gain diamond",
    },
  },

  Housekeeper: {
    // related filed constants.HOUSEKEEPER.BUILDABLEID_*.NAME
    DisplayName: {
      "BakeryHousekeeper": "Bakery Man",
      "SnackHousekeeper": "Snack Boy",
      "CafeHousekeeper": "Coffee Master",
    },

    Description: {
      "BakeryHousekeeper": "The \"Bakery Man\" helps you manage the \"Bakery\" shops.",
      "SnackHousekeeper": "The \"Snack Boy\" helps you manage the \"Snack\" shops.",
      "CafeHousekeeper": "The \"Coffee Master\" helps you manage the \"Cafe\" shops.",
    },
    
    Tip: {
      servingBuildable: "Serving shops",
      onDutyDuration: "Works continuously",
      restDuration: "Sleeps continuously",
      elapsedOnDutyTime: "Remaining working time",
      elapsedRestTime: "Remaining sleeping time",
      descriptionHint: " ", 
      upgrade: "Upgrade",
      backToWork: "Work now!",
      employ: "Employ",
      employable: "View",
      maxLevel: "Max Level",
      upgradable: "Upgradable",
    },

    // 如果加了对话，需要修改housekeepNpc.js中servingTipLabel的取值范围
    words: {
      1: "Have a good day!",
      2: "Thank you!",
      3: "May it the perfect taste for you",
      4: "My pleasure to serve",
      5: "At your service",
      6: "Always here for you",
    },
    sorryWords: {
      1: "Sorry for missing the recipe >_<",
      2: "We'll learn it asap >_<",
      3: "Learning it learning it T_T",
      4: "I should have prepared it... T_T",
    },
  },

  HousekeeperChangeConfirmationPanel: {
    title: 'Upgrade？',
    Tip: {
      onDutyDuration: 'Working Duration：',
      restDuration: 'Sleeping Duration：',
    },
  },

  StatefulBuildableOrderingNpc: {
    complainWords: {
      // 如果加了对话，需更改npcScriptIns.popupLabel.string的取值范围
      1: "I want nothing else but \"%s\"!",
      2: "Disappointed! I came from 10 miles away to eat \"%s\"!",
      3: "Actually you should have learned \"%s\" from the \"Archive\"",
      4: "Disappointed, I wanna eat \"%s\"...",
      5: "I'll come only after you learn \"%s\"",
      6: "Oh no, our child only eats \"%s\", what can I do now T_T",
      7: "Maybe you can just open \"Archive\" and learn \"%s\"?",
    },
  },

  GameSettingsPanel: {
    Title: "Settings",
  },
};
