"use strict";

var _ROUTE_PATH;

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var constants = {
  STATELESS_BUILDABLE_ID: {
    // 如果更改buildableId, 需要相应地更改housekeeper的索引值, eg: BUILDBALEID_3 -> BUILDBALEID_4
    HEADQUARTER: 1,
    FARMLAND: 2,
    RESTAURANT: 3,
    BAKERY: 4,
    SNACK: 3,
    CAFE: 5,
    MARKET: 6,
    ICE_CREAM_VAN: 7,
    GASHAPON: 8,
    FRUIT_STAND: 9,
    LABORATORY: 10,
    FIRE_TOWER: 100,
    STONE_TOWER: 101,
    THUNDER_TOWER: 102,
    CANNON_TOWER: 103,


    // enemy buildable
    FORTRESS: 200,

    GLOBAL_CACHED_GOLD: 1000,
  },
  PEOPLE_IMG_PATH: "animation/FrameAnimTextures/People/FrameAnimPeoples",
  ENABLE_MAPLIST_BUTTON_MISSIONId: 2,
  BGM: {
    DIR_PATH: "resources/BGM/",
    COLLECT_CASH_FILE_NAME: "collectCash.mp3",
    BUTTON_CLICK_EFFECT_FILE_NAME: "buttonClick.mp3",
    COLLECT_CASH_FILE_NAME: "collectCash.mp3",
    GOT_CERT_FILE_NAME: "gotCert.mp3"
  },
  COOK_ANIM: {
    DIR_PATH: "animation/Cook_"
  },
  SOCKET_EVENT: {
    CONTROL: "control",
    SYNC: "sync",
    LOGIN: "login",
    CREATE: "create"
  },
  ROUTE_PATH: {
    PLAYER: "/Player",
    API: "/api",
    IAP: "/Iap",
    RECEIPT: "/Receipt",
    SUBMIT: "/Submit",
    VERSION: "/v1",
    SMS_CAPTCHA: "/SmsCaptcha",
    GOOGLE_AUTH: "/GoogleAuth",
    BYTE_DANCE: "/ByteDance",
    GAME_CENTER: "/GameCenter",
    INT_AUTH_TOKEN: "/IntAuthToken",
    LOGIN: "/Login",
    LOGOUT: "/Logout",
    OBTAIN: "/Obtain",
    REPORT: "/Report",
    QUERY: "/Query",
    ANONYMOUS: "/Anonymous",
    DARWIN: "/Darwin",
    GLOBAL: "/Global",
    AUTH_CONF: "/AuthConf",
    BUILDABLE_LEVEL_CONF: "/BuildableLevelConf",
    UUID: "/Uuid",
    RET_CODE: "/RetCode",
    REGEX: "/Regex",
    MYSQL: "/MySQL",
    SYNCDATA: "/SyncData",
    UPSYNC:"/Upsync",
    BUILDABLE_LIST: "/BuildableList",
    KNAPSACK: "/Knapsack",
    SYNTHESIZE: "/Synthesize",
    RECLAIM: "/Reclaim",
    INGREDIENT: "/Ingredient",
    PRODUCE: "/Produce",
    PLAYER_BUILDABLE_BINDING: "/PlayerBuildableBinding",
    INGREDIENT_LIST: "/IngredientList",
    INGREDIENT_PROGRESS: "/IngredientProgress",
    CANCEL: "/Cancel",
    COLLECT: "/Collect",
    BOOSTING: "/Boosting",
    WECHATGAME: "/WechatGame",
    WECHAT: "/Wechat",
    MISSIONLIST: "/MissionList",
    MISSIONREWARD: "/MissionReward",
    LIST: "/List",
    STAGE: "/Stage",
    STAGE_PLAYER_BUILDABLE_BINDING: "/StagePlayerBuildableBinding",
    PLAYER_STAGE_TERMINATE: "/Terminate",
    PLAYER_STAGE_BINDING: "/PlayerStageBinding",
    PLAYER_STAGE: '/PlayerStage',
    PURCHASE: '/Purchase',
    DIAMOND: '/Diamond',
    STAR: '/Star',
  }, 
  COLLECT_CASH_NUM: 100,
  RET_CODE: {
    "OK": 1000,
    "UNKNOWN_ERROR": 1001,
    "INVALID_REQUEST_PARAM": 1002,
    "IS_TEST_ACC": 1003,
    "MYSQL_ERROR": 1004,
    "LACK_OF_DIAMOND": 1006,
    "LACK_OF_GOLD": 1007,
    "LACK_OF_ENERGY": 1008,

    "SMS_CAPTCHA_REQUESTED_TOO_FREQUENTLY": 5001,
    "SMS_CAPTCHA_NOT_MATCH": 5002,

    "INVALID_TOKEN": 2001,
    "DUPLICATED": 2002,
    "INCORRECT_HANDLE": 2004,
    "NONEXISTENT_HANDLE": 2005,
    "INCORRECT_PASSWORD": 2006,
    "INCORRECT_CAPTCHA": 2007,
    "INVALID_EMAIL_LITERAL": 2008,
    "NO_ASSOCIATED_EMAIL": 2009,
    "SEND_EMAIL_TIMEOUT": 2010,
    "INCORRECT_PHONE_COUNTRY_CODE": 2011,
    "NEW_HANDLE_CONFLICT": 2013,
    "FAILED_TO_UPDATE": 2014,
    "FAILED_TO_DELETE": 2015,
    "FAILED_TO_CREATE": 2016,
    "INCORRECT_PHONE_NUMBER": 2018,
    "NONEXISTENT_RECIPE": 2019,
    "RECIPE_NOT_UNLOCKED": 2020,
    "SUCCESSFUL_KNOWN_RECIPE_AND_KNOWN_INGREDIENT": 2021,
    "SUCCESSFUL_NEW_RECIPE_AND_KNOWN_INGREDIENT": 2022,
    "SUCCESSFUL_KNOWN_RECIPE_AND_NEW_INGREDIENT": 2023,
    "SUCCESSFUL_NEW_RECIPE_AND_NEW_INGREDIENT": 2024,
    "INGREDIENT_PROGRESS_MAX_PER_PLAYER_EXCEEDED": 2025,
    "INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING_EXCEEDED": 2026,
    "RECIPE_NAME_UNKNOWN": 2027,
    "WECHAT_SERVER_ERROR": 2028,
    "REDIS_ERROR": 2029,
    "NO_ENOUGH_DIAMOND": 2030,
    "NO_ENOUGH_STAR": 2031,
    "STAGE_STILL_LOCKED": 2032,
    "API_CALL_LIMIT_EXCEEDED": 2033,
    "POPULATION_LIMIT_EXCEEDED": 2034,
    "ALREADY_OBTAINED": 2035,
    "RESEARCH_IN_PROGRESS": 2036,
    "NONEXISTENT_UUID_CHANNEL_AUTH_PAIR": 2037,

    "INVALID_KIOSK_CREDENTIALS": 3000,
    "INSUFFICIENT_MEM_TO_ALLOCATE_CONNECTION": 3001,
    "KIOSK_ALREADY_CONNECTED": 3002,
    "NONEXISTENT_KIOSK": 3003,

    "PASSWORD_RESET_CODE_GENERATION_PER_EMAIL_TOO_FREQUENTLY": 4000,
    "TRADE_CREATION_TOO_FREQUENTLY": 4002,
    "MAP_NOT_UNLOCKED": 4003,

    "NOT_IMPLEMENTED_YET": 65535,
    "VICTIM_RESTAURANT_IS_ATTACKING": 65536,
    "VICTIM_RESTAURANT_IS_WORKING": 65537,

  },
  AUDIO_PATH: {
    BGM: 'res/raw-assets/resources/audio/BGM.mp3',
    SCORE: 'res/raw-assets/resources/audio/score.mp3',
    CLICK: 'res/raw-assets/resources/audio/click.mp3'
  },
  NPC_ANIM: {
    NAME: {
      DUCK: "DUCK",
      HEN: "HEN",
      HAT_GIRL: "PATROL_NPC_1",
      GREEN_HAIR_BOY: "PATROL_NPC_2",
      ORANGE_HAT_GIRL: "PATROL_NPC_3",
      BLACK_HAIR_GIRL: "PATROL_NPC_4",
      WOLFMAN: "SOLDIER_01",
      WITCH: "SOLDIER_02",
      BOWLCUT: "SOLDIER_03", 
      ELFWARRIOR: "SOLDIER_04",
      ORCWARRIOR: "SOLDIER_05",
      BIGSHEEP: "SOLDIER_06",
      SMALLSHEEP: "SOLDIER_07",
    },
  },
  INVALID_STAGE_INDEX: -1,
  INVALID_GROUP_INDEX: -1,
  TUTORIAL_STAGE_GROUP: {
    // IdleGameMap新手教程:
    0: {
      START: 0,
      END: 14,
      EDGES: {
        /*
         * Only successors are persisted in these data.
         * The first adjacent successor edge is the default route.
         * Those without any successor in group is automatically an end, and every group MUST come with only a SINGLE START.
         * Every group MUST come with only a SINGLE END that contains no "Caption".
         *
         * -- YFLu, 2019-10-11.
         */
        0: [1],
        1: [2],
        2: [3],
        3: [4],
        4: [5],
        5: [6],
        6: [7],
        7: [8],
        8: [9],
        9: [10],
        10: [11],
        11: [12],
        12: [13],
        13: [14],
      }, 
    },
    1: {
      START: 17,
      END: 27,
      EDGES: {
        17: [18],
        18: [19],
        19: [20],
        20: [21],
        21: [22],
        22: [23],
        23: [24],
        24: [25],
        25: [26],
        26: [27],
      }, 
    },
    // stage1新手教程
    2: {
      START: 35,
      END: 42,
      EDGES: {
        35: [36],
        36: [37],
        37: [38],
        38: [39],
        39: [40],
        40: [41],
        41: [42],
      },
    },
    // 解锁Ingredient新手教程
    3: {
      START: 50,
      END: 54,
      EDGES: {
        50: [51],
        51: [52],
        52: [53],
        53: [54],
      },
    },
    // 演示型新手教程
    9999: {
      START: 9999,
      END: 9995,
      EDGES: {
        9999: [9998],
        9998: [9997],
        9997: [9996],
        9996: [9995],
      },
    },
  },
  RESOURCE_TYPE: {
    GOLD: 0,
    STATEFUL_BUILDABLE_LEVEL: 1,
    DIAMOND: 2,
    RECIPE: 3,
    TARGET_INGREDIENT: 4,
    SOLDIER_INGREDIENT_ID: 9,
    DEFENDER_BUILDABLE_ID: 10,
    ESCAPED_ATTACKING_NPC_FOR_ENEMY: 100,
    ESCAPED_ATTACKING_NPC_FOR_ALLY: 101,
    STATEFULBUILDABLE_DESTORYED: 102,
  },
  COMPLETE_STATE: {
    NOT_COMPLETE: 0,
    COMPLETED_NOT_GET_GIFT: 1,
    COMPLETED_GET_GIFT: 2,
    CLAIMED_IN_UPSYNC: 3,
  },
  TIME_CHUNK: {
    MILLIS_IN_SECOND: 1000,
    SECONDS_IN_MINUTE: 60,
    MINUTES_IN_HOUR: 60,
    HOURS_IN_DAY: 24,

    SECONDS_IN_HOUR: 3600,
    SECONDS_IN_DAY: 86400,
  },
  DIAMOND_PRODUCT_INFO: {
    LittleDiamondPackage: {
      DIAMOND_NUM: 80,
    },
    MediumDiamondPackage: {
      DIAMOND_NUM: 500,
    },
    LargeDiamondPackage: {
      DIAMOND_NUM: 1200,
    },
    HugeDiamondPackage: {
      DIAMOND_NUM: 6500,
    },
    TremendousDiamondPackage: {
      DIAMOND_NUM: 13000,
    },
  },
  PAGER: {
    NUM_PER_PAGE: 4
  },
  ATTACK_STATE: {
    INITIAL: 0,
    ATTACKING: 2,
  },
  COOK_STATE: {
    IDLE: 1,
    WORK_FOR_OWN_RESTAURANT: 2,
    WORK_FOR_VICTIM_RESTAURANT:3,
  },
  GEN_GUEST_DURATION_MILLIS: 3000,
  TEXTURES_PATH: {
    ROOT: "/textures/RuntimeLoading",
    STATELESS_BUILDING: "/StatelessBuilding",
    INGREDIENT: "/Ingredients",
  },
  SEND_PLAYER_SYNC_DATA_DURATION: 5,
  SEND_PLAYER_SYNC_DATA_DURATION_MILLIS: 5000,
  RESIDENTS_COUNT_INCREMENTS_PER_FARMLAND: 8,
  CAMERA_AUTO_TRANSLATION: {
    BOUNDARY_WEIGHT: 0.1,
    MOVE_PIXELS: 20,
    MOVE_INTERVAL_MILLS: 30,
    FAST_MOVE_BOUNDARY_WEIGHT: 0.3,
  },
  BUILDING_ANIM: {
    DEFAULT_UPGRADING: "Default_Upgrading",
    DEFAULT_BUILDING: "Default_Upgrading",
  },
  BUILDABLE: {
    WIDTH: 450,
    HEIGHT: 330,
    SKELETAL_SCALE: 1,
    SPECIFIED_WIDTH: {
      Farmland: 430,
    },
    SPECIFIED_HEIGHT: {
      Farmland: 430,
    },
    SKELETAL_OFFSET: {
      Headquarter: { x: 0, y: 300 },
      Farmland: { x: 0, y: null },
      Bakery: { x: 0, y: 534 * 0.5 + 30 },
      Restaurant: { x: 30, y: 430 * 0.6 + 90 },
      Snack: { x: 30, y: 430 * 0.6 + 90 },
      Laboratory: { x: 0, y: 250 + 50 },
      Cafe: { x: 0, y: 250 + 50 },
      Market: { x: 0, y: 150 },
    },
    SPECIFIED_SKELETAL_SCALE: {
      
    },
    TYPE: {
      DEFENDER: 100, 
    },
  },
  SIZE: {
    BUILDABLE_WITH_COUNT: 250,
  },
  EVENT: {
    DRAGGING: {
      START: "dragging-start",
      MOVE: "dragging-move",
      END: "dragging-end",
    },
    DROP: "drop",
    CELL_CLICK: "click",
    CELL_INFO_BUTTON_CLICKED: "info-clicked",
  },
  INGREDIENT: {
    PRICE_CURRENCY: {
      GOLD: 1,
      DIAMOND: 2,
    },
    CATEGORY: {
      FREEORDER: 0,
      CONSUMABLE: 1,
      SOLDIER: 1000,
      TECH: 2000,
    },
  },
  INGREDIENT_PROGRESS_STATE: {
    PENDING_IN_PRODUCTION_QUEUE_TO_BE_AUTOMATICALLY_COLLECTED: 0,
    PRODUCING_TO_BE_AUTOMATICALLY_COLLECTED: 1,
    PENDING_IN_PRODUCTION_QUEUE_TO_BE_MANUALLY_COLLECTED: 2,
    PRODUCING_TO_BE_MANUALLY_COLLECTED: 3,
    COMPLETED_TO_BE_MANUALLY_COLLECTED: 4,
    PENDING_IN_RECLAIM_QUEUE_TO_BE_MANUALLY_COLLECTED: 5,
    RECLAIMING_TO_BE_MANUALLY_COLLECTED: 6,
    RECLAIMED_TO_BE_MANUALLY_COLLECTED: 7,
  },
  BUILDABLE_INGREDIENT_INTERACTION: {
    TYPE: {
      SYNTHESIZE_CONSUMABLE: 1,
      RECLAIM: 2,
      SYNTHESIZE_TARGET: 3,
      PRODUCIBLE: 4,
      SYNTHESIZABLE: 5,
      WILL_UNLOCK_RECIPE: 6,
      // TODO: Correct the value.
      FREEORDER: 7,
    },
  },
  NETWORK: {
    ERROR: {
      TIMEOUT: "timeout",
    },
  },
  ERROR: {
    TIMEOUT: new Error("timeout"),
    WECHAT_PLATFORM_REQUIRED: new Error("wecaht platform required."),
    UNKNOWN: new Error("unknown"),
  },
  ADD_NOISE_TO_ASTAR: true,
  PRICE: {
    SYNTHESIZE: 150,
  },
  INGREDIENT_PROGRESS_MAX_PER_PLAYER_BUILDABLE_BINDING: 15,
  RECIPE: {
    STATE: {
      LOCKED_DISPLAY_NAME_CONSUMABLES_UNKNOWN: 1,
      LOCKED_DISPLAY_NAME_CONSUMABLES_KNOWN: 2,
      UNLOCKED: 3,
      LOCKED_INGREDIENT_KNOWN: 4,
    },
    PREPENDED_BINOCULAR_OPERATOR: {
      RESULT: "=",
      CONSUMABLE: "+",
    },
  },
  STATELESS_BUILDABLE_INSTANCE_CARD_ORDER: {
    HEADQUARTER: 0,
    FARMLAND: 1,
    RESTAURANT: 2,
    BAKERY: 4,
    LABORATORY: 3,
  },
  DURATION_MILLIS: {
    PROGRESS_LOADING: 10000,
    PROGRESS_LOADED: 300,
    AUTO_ORDER_ALIVE: 60000,             // 订单持续时间，ms
    SPAWN_AN_ORDERING_NPC: 4000,         // npc生成频率，ms/个
    SPAWN_AN_ORDERING_NPC_IN_COMBO: 500, // npc生成频率，ms/个
    AUTO_ORDER_ALIVE_IN_COMBO: 10000,    // 订单持续时间，ms
    COMBO: 30000,  // 这个是一局Combo的持续时间。
  },
  SPEED: {
    ORDERING_NPC: 200,
    ORDERING_NPC_IN_TUTORIAL: 300,
    ORDERING_NPC_IN_COMBO: 500, // Npc移动速度, pt
    HOUSEKEEPER_NPC: 400,
  },
  SPAWNED_ORDERING_NPC_COUNT_PER_INTERVAL: 1,
  SPAWNED_ORDERING_NPC_COUNT_PER_INTERVAL_IN_COMBO: 1, // 一次性生成的npc个数
  QUEST_RESOURCE_TYPE: {
    GOLD: 0,
    STATEFUL_BUILDABLE_LEVEL: 1,
    DIAMOND: 2,   
    RECIPE: 3,
    TARGET_INGREDIENT: 4,
    SERVED_CUSTOMER: 5,
    DISH_SOLD: 6,
    INGREDIENT_PRODUCED: 7,
    FREEORDER_INCOME: 8,
  },
  MISSION_STATE: {
    INCOMPLETE: 0,
    COMPLETED: 1,
    COMPLETED_OBTAINED: 2,
    CLAIMED_IN_UPSYNC: 3,
  },
  MISSION_TYPE: {
    SIMPLE_MISSION: 0,
    ACHIEVEMENT: 1,
  },
  MISSION_REPRODUCTIVE: {
    SIMPLE_MISSION: 0,
    DAILY_MISION: 2,
  },
  AUTO_ORDER_STATE: {
    NOT_TAKEN_NOT_READY: 0,
    NOT_TAKEN_READY: 1,
    TAKEN_RECLAIMING: 2,
    RECLAIMED: 3,
  },
  FREE_AUTO_ORDER_STATE: {
    NOT_TAKEN: 0,
    TAKEN_TRADING: 1,
    DELIVERED: 2,
    ABORTED: 3,
  },
  MAX_NPC_COUNT_PER_STATEFUL_BUILDBALE: 1000,
  BATTLE_TEAM: {
    DEFAULT_ALLY_TEAM_ID: 0,
    DEFAULT_ENEMY_TEAM_ID: 1,
  },
  STAGE_BINDING: {
    STATE: {
      UNLOCKED_BY_STARS: 1,
      UNLOCKED_BY_DIAMONDS: 2,
      UNLOCKED_BY_COMPLETING_PREV_STAGE: 3,
    },
  },
  MAX_ORDERING_NPC_IN_QUEUE_COUNT_FOR_PER_STATEFUL_BUILDABLE: 10,
  PLAYER_INGREDIENT_FOR_IDLEGAME: {
    STATE: {
      UNLOCKED: 3,
      LOCKED_INGREDIENT_PURCHASABLE_TO_UNLOCK: 2,
      LOCKED_NAME_KNOWN: 1
    },
  },
  // Chair related configure. [begin]
  NPC_POSITION_OFFSET_TO_CHAIR_SPRITE_CENTER: {
    "1": {
      "TopRight": { x: 17, y: -13 },
      "TopLeft": { x: -17, y: -13},
    },
  },
  CHAIR_CENTER_OFFSET_TO_SPRITE_CENTER: {
    "1": { x: 0, y: 14 },
  },
  CHAIR_OFFSET_DATA: [
    {"chairId":1,"buildableId":3,"buildableLevel":1,"offsetX":120,"offsetY":-60},
    {"chairId":2,"buildableId":3,"buildableLevel":2,"offsetX":-170,"offsetY":-47},
    {"chairId":3,"buildableId":3,"buildableLevel":2,"offsetX":120,"offsetY":-60},
    {"chairId":4,"buildableId":3,"buildableLevel":3,"offsetX":-91,"offsetY":-70},
    {"chairId":5,"buildableId":3,"buildableLevel":3,"offsetX":75,"offsetY":-90},
    {"chairId":6,"buildableId":3,"buildableLevel":3,"offsetX":146,"offsetY":25},
    {"chairId":7,"buildableId":3,"buildableLevel":4,"offsetX":-160,"offsetY":16},
    {"chairId":8,"buildableId":3,"buildableLevel":4,"offsetX":-91,"offsetY":-70},
    {"chairId":9,"buildableId":3,"buildableLevel":4,"offsetX":75,"offsetY":-90},
    {"chairId":10,"buildableId":3,"buildableLevel":4,"offsetX":146,"offsetY":25},
    {"chairId":11,"buildableId":3,"buildableLevel":5,"offsetX":-160,"offsetY":16},
    {"chairId":12,"buildableId":3,"buildableLevel":5,"offsetX":-91,"offsetY":-70},
    {"chairId":13,"buildableId":3,"buildableLevel":5,"offsetX":75,"offsetY":-90},
    {"chairId":14,"buildableId":3,"buildableLevel":5,"offsetX":146,"offsetY":25},
    {"chairId":15,"buildableId":3,"buildableLevel":6,"offsetX":-160,"offsetY":16},
    {"chairId":16,"buildableId":3,"buildableLevel":6,"offsetX":-91,"offsetY":-70},
    {"chairId":17,"buildableId":3,"buildableLevel":6,"offsetX":75,"offsetY":-90},
    {"chairId":18,"buildableId":3,"buildableLevel":6,"offsetX":146,"offsetY":25},
    {"chairId":19,"buildableId":3,"buildableLevel":7,"offsetX":-160,"offsetY":16},
    {"chairId":20,"buildableId":3,"buildableLevel":7,"offsetX":-91,"offsetY":-70},
    {"chairId":21,"buildableId":3,"buildableLevel":7,"offsetX":75,"offsetY":-90},
    {"chairId":22,"buildableId":3,"buildableLevel":7,"offsetX":146,"offsetY":25},
    {"chairId":23,"buildableId":3,"buildableLevel":8,"offsetX":-160,"offsetY":16},
    {"chairId":24,"buildableId":3,"buildableLevel":8,"offsetX":-91,"offsetY":-70},
    {"chairId":25,"buildableId":3,"buildableLevel":8,"offsetX":75,"offsetY":-90},
    {"chairId":26,"buildableId":3,"buildableLevel":8,"offsetX":146,"offsetY":25},
    {"chairId":27,"buildableId":3,"buildableLevel":9,"offsetX":-160,"offsetY":16},
    {"chairId":28,"buildableId":3,"buildableLevel":9,"offsetX":-91,"offsetY":-70},
    {"chairId":29,"buildableId":3,"buildableLevel":9,"offsetX":75,"offsetY":-90},
    {"chairId":30,"buildableId":3,"buildableLevel":9,"offsetX":146,"offsetY":25},
    {"chairId":31,"buildableId":3,"buildableLevel":10,"offsetX":-160,"offsetY":16},
    {"chairId":32,"buildableId":3,"buildableLevel":10,"offsetX":-91,"offsetY":-70},
    {"chairId":33,"buildableId":3,"buildableLevel":10,"offsetX":75,"offsetY":-90},
    {"chairId":34,"buildableId":3,"buildableLevel":10,"offsetX":146,"offsetY":25},
    {"chairId":35,"buildableId":4,"buildableLevel":1,"offsetX":120,"offsetY":-60},
    {"chairId":36,"buildableId":4,"buildableLevel":2,"offsetX":-170,"offsetY":-47},
    {"chairId":37,"buildableId":4,"buildableLevel":2,"offsetX":120,"offsetY":-60},
    {"chairId":38,"buildableId":4,"buildableLevel":3,"offsetX":-91,"offsetY":-70},
    {"chairId":39,"buildableId":4,"buildableLevel":3,"offsetX":75,"offsetY":-90},
    {"chairId":40,"buildableId":4,"buildableLevel":3,"offsetX":146,"offsetY":25},
    {"chairId":41,"buildableId":4,"buildableLevel":4,"offsetX":-160,"offsetY":16},
    {"chairId":42,"buildableId":4,"buildableLevel":4,"offsetX":-91,"offsetY":-70},
    {"chairId":43,"buildableId":4,"buildableLevel":4,"offsetX":75,"offsetY":-90},
    {"chairId":44,"buildableId":4,"buildableLevel":4,"offsetX":146,"offsetY":25},
    {"chairId":45,"buildableId":4,"buildableLevel":5,"offsetX":-160,"offsetY":16},
    {"chairId":46,"buildableId":4,"buildableLevel":5,"offsetX":-91,"offsetY":-70},
    {"chairId":47,"buildableId":4,"buildableLevel":5,"offsetX":75,"offsetY":-90},
    {"chairId":48,"buildableId":4,"buildableLevel":5,"offsetX":146,"offsetY":25},
    {"chairId":49,"buildableId":4,"buildableLevel":6,"offsetX":-160,"offsetY":16},
    {"chairId":50,"buildableId":4,"buildableLevel":6,"offsetX":-91,"offsetY":-70},
    {"chairId":51,"buildableId":4,"buildableLevel":6,"offsetX":75,"offsetY":-90},
    {"chairId":52,"buildableId":4,"buildableLevel":6,"offsetX":146,"offsetY":25},
    {"chairId":53,"buildableId":4,"buildableLevel":7,"offsetX":-160,"offsetY":16},
    {"chairId":54,"buildableId":4,"buildableLevel":7,"offsetX":-91,"offsetY":-70},
    {"chairId":55,"buildableId":4,"buildableLevel":7,"offsetX":75,"offsetY":-90},
    {"chairId":56,"buildableId":4,"buildableLevel":7,"offsetX":146,"offsetY":25},
    {"chairId":57,"buildableId":4,"buildableLevel":8,"offsetX":-160,"offsetY":16},
    {"chairId":58,"buildableId":4,"buildableLevel":8,"offsetX":-91,"offsetY":-70},
    {"chairId":59,"buildableId":4,"buildableLevel":8,"offsetX":75,"offsetY":-90},
    {"chairId":60,"buildableId":4,"buildableLevel":8,"offsetX":146,"offsetY":25},
    {"chairId":61,"buildableId":4,"buildableLevel":9,"offsetX":-160,"offsetY":16},
    {"chairId":62,"buildableId":4,"buildableLevel":9,"offsetX":-91,"offsetY":-70},
    {"chairId":63,"buildableId":4,"buildableLevel":9,"offsetX":75,"offsetY":-90},
    {"chairId":64,"buildableId":4,"buildableLevel":9,"offsetX":146,"offsetY":25},
    {"chairId":65,"buildableId":4,"buildableLevel":10,"offsetX":-160,"offsetY":16},
    {"chairId":66,"buildableId":4,"buildableLevel":10,"offsetX":-91,"offsetY":-70},
    {"chairId":67,"buildableId":4,"buildableLevel":10,"offsetX":75,"offsetY":-90},
    {"chairId":68,"buildableId":4,"buildableLevel":10,"offsetX":146,"offsetY":25},
    {"chairId":69,"buildableId":5,"buildableLevel":1,"offsetX":120,"offsetY":-60},
    {"chairId":70,"buildableId":5,"buildableLevel":2,"offsetX":-170,"offsetY":-47},
    {"chairId":71,"buildableId":5,"buildableLevel":2,"offsetX":120,"offsetY":-60},
    {"chairId":72,"buildableId":5,"buildableLevel":3,"offsetX":-91,"offsetY":-70},
    {"chairId":73,"buildableId":5,"buildableLevel":3,"offsetX":75,"offsetY":-90},
    {"chairId":74,"buildableId":5,"buildableLevel":3,"offsetX":146,"offsetY":25},
    {"chairId":75,"buildableId":5,"buildableLevel":4,"offsetX":-160,"offsetY":16},
    {"chairId":76,"buildableId":5,"buildableLevel":4,"offsetX":-91,"offsetY":-70},
    {"chairId":77,"buildableId":5,"buildableLevel":4,"offsetX":75,"offsetY":-90},
    {"chairId":78,"buildableId":5,"buildableLevel":4,"offsetX":146,"offsetY":25},
    {"chairId":79,"buildableId":5,"buildableLevel":5,"offsetX":-160,"offsetY":16},
    {"chairId":80,"buildableId":5,"buildableLevel":5,"offsetX":-91,"offsetY":-70},
    {"chairId":81,"buildableId":5,"buildableLevel":5,"offsetX":75,"offsetY":-90},
    {"chairId":82,"buildableId":5,"buildableLevel":5,"offsetX":146,"offsetY":25},
    {"chairId":83,"buildableId":5,"buildableLevel":6,"offsetX":-160,"offsetY":16},
    {"chairId":84,"buildableId":5,"buildableLevel":6,"offsetX":-91,"offsetY":-70},
    {"chairId":85,"buildableId":5,"buildableLevel":6,"offsetX":75,"offsetY":-90},
    {"chairId":86,"buildableId":5,"buildableLevel":6,"offsetX":146,"offsetY":25},
    {"chairId":87,"buildableId":5,"buildableLevel":7,"offsetX":-160,"offsetY":16},
    {"chairId":88,"buildableId":5,"buildableLevel":7,"offsetX":-91,"offsetY":-70},
    {"chairId":89,"buildableId":5,"buildableLevel":7,"offsetX":75,"offsetY":-90},
    {"chairId":90,"buildableId":5,"buildableLevel":7,"offsetX":146,"offsetY":25},
    {"chairId":91,"buildableId":5,"buildableLevel":8,"offsetX":-160,"offsetY":16},
    {"chairId":92,"buildableId":5,"buildableLevel":8,"offsetX":-91,"offsetY":-70},
    {"chairId":93,"buildableId":5,"buildableLevel":8,"offsetX":75,"offsetY":-90},
    {"chairId":94,"buildableId":5,"buildableLevel":8,"offsetX":146,"offsetY":25},
    {"chairId":95,"buildableId":5,"buildableLevel":9,"offsetX":-160,"offsetY":16},
    {"chairId":96,"buildableId":5,"buildableLevel":9,"offsetX":-91,"offsetY":-70},
    {"chairId":97,"buildableId":5,"buildableLevel":9,"offsetX":75,"offsetY":-90},
    {"chairId":98,"buildableId":5,"buildableLevel":9,"offsetX":146,"offsetY":25},
    {"chairId":99,"buildableId":5,"buildableLevel":10,"offsetX":-160,"offsetY":16},
    {"chairId":100,"buildableId":5,"buildableLevel":10,"offsetX":-91,"offsetY":-70},
    {"chairId":101,"buildableId":5,"buildableLevel":10,"offsetX":75,"offsetY":-90},
    {"chairId":102,"buildableId":5,"buildableLevel":10,"offsetX":146,"offsetY":25},
  ],

  // Chair related configure. [begin]

  FUTURE_STAGE_ID: 99999,

  HOUSEKEEPER: {
    BUILDABLEID_3: {
      TYPE: 1,
      NAME: "SnackHousekeeper",
      LEVEL_BINDINGS: {
        "1": {
          ON_DUTY_DURATION_MILLIS: 200 * 0.5 * 1000, // millis
          REST_DURATION_MILLIS: 200 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 3000,
        },
        "2": {
          ON_DUTY_DURATION_MILLIS: 250 * 0.6 * 1000, // millis
          REST_DURATION_MILLIS: 250 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 10000,
        },
        "3": {
          ON_DUTY_DURATION_MILLIS: 300 * 0.75 * 1000, // millis
          REST_DURATION_MILLIS: 300 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 20000,
        },
        "4": {
          ON_DUTY_DURATION_MILLIS: 350 * 1 * 1000, // millis
          REST_DURATION_MILLIS: 350 * 1 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 40000,
        },
        "5": {
          ON_DUTY_DURATION_MILLIS: 400 * 1.4 * 1000, // millis
          REST_DURATION_MILLIS: 400 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 100000,
        },
      },
      MAX_LEVEL: 5,
    },
    BUILDABLEID_4: {
      TYPE: 1,
      NAME: "BakeryHousekeeper",
      LEVEL_BINDINGS: {
        "1": {
          ON_DUTY_DURATION_MILLIS: 300 * 0.5 * 1000, // millis
          REST_DURATION_MILLIS: 300 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 10000,
        },
        "2": {
          ON_DUTY_DURATION_MILLIS: 400 * 0.6 * 1000, // millis
          REST_DURATION_MILLIS: 400 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 20000,
        },
        "3": {
          ON_DUTY_DURATION_MILLIS: 500 * 0.75 * 1000, // millis
          REST_DURATION_MILLIS: 500 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 50000,
        },
        "4": {
          ON_DUTY_DURATION_MILLIS: 600 * 1 * 1000, // millis
          REST_DURATION_MILLIS: 600 * 1 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 100000,
        },
        "5": {
          ON_DUTY_DURATION_MILLIS: 700 * 1.4 * 1000, // millis
          REST_DURATION_MILLIS: 700 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 150000,
        },
      },
      MAX_LEVEL: 5,
    },
    BUILDABLEID_5: {
      TYPE: 1,
      NAME: "CafeHousekeeper",
      LEVEL_BINDINGS: {
        "1": {
          ON_DUTY_DURATION_MILLIS: 300 * 0.5 * 1000, // millis
          REST_DURATION_MILLIS: 300 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 20000,
        },
        "2": {
          ON_DUTY_DURATION_MILLIS: 450 * 0.6 * 1000, // millis
          REST_DURATION_MILLIS: 450 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 40000,
        },
        "3": {
          ON_DUTY_DURATION_MILLIS: 600 * 0.75 * 1000, // millis
          REST_DURATION_MILLIS: 600 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 60000,
        },
        "4": {
          ON_DUTY_DURATION_MILLIS: 750 * 1 * 1000, // millis
          REST_DURATION_MILLIS: 750 * 1 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 120000,
        },
        "5": {
          ON_DUTY_DURATION_MILLIS: 900 * 1.4 * 1000, // millis
          REST_DURATION_MILLIS: 900 * 1000, // millis
          UNLOCK_OR_UPGRADE_REQUIRED_GOLD: 200000,
        },
      },
      MAX_LEVEL: 5,
    },
    // deprecated field. [begin] {
    ON_DUTY_DURATION_MILLIS: 0 * 1000, // millis
    REST_DURATION_MILLIS: 9999999 * 1000, // millis
    UNLOCK_REQUIRED_GOLD: 9999999,
    // deprecated field. [end] }
    CACHED_GOLD_OFFSET_TO_BUILDBALE_SPRITE_CENTER: { x: 128, y: -64 },
    TYPE: {
      FREEORDER: 1,
    }
  },

  ADMOB_ERROR_CODE: {
    NO_FILL :3,
    TIMED_OUT: 9999,
    UNKNOWN: 99999,
  },

  TRIGGER_INGREDIENT_LEARNING_COUNT: 3,

  COMBO_RULE: [
    // 将寻找第一个匹配的对象，因此需要注意规则的先后顺序。
    { compare: "<=", comboCount: 5, rewardedGold: 50, rewardedDiamond: 1, durationMillis: 3000, incomeRatio: 1 },
    { compare: "<=", comboCount: 10, rewardedGold: 100, rewardedDiamond: 1, durationMillis: 2500, incomeRatio: 1.2 },
    { compare: "<=", comboCount: 15, rewardedGold: 200, rewardedDiamond: 1, durationMillis: 2000, incomeRatio: 1.2 },
    { compare: "<=",  comboCount: 20, rewardedGold: 500, rewardedDiamond: 2, durationMillis: 1500, incomeRatio: 1.5 },
    { compare: ">", comboCount: 20, rewardedGold: 1000, rewardedDiamond: 5, durationMillis: 1000, incomeRatio: 1.5 },
  ],

  NARRATOR: {
    SEAGUTS: "Narrator",
    WARRIOR: "Narrator_01",
    FOX: "Narrator_02",
    GIRL: "Narrator_03",
  },
  AUTO_FILL_DIAMOND_COUNT: 15,
};

constants.NPC_ANIM.NAME[constants.HOUSEKEEPER.BUILDABLEID_3.NAME] = "HOUSEKEEPER_01";
constants.NPC_ANIM.NAME[constants.HOUSEKEEPER.BUILDABLEID_4.NAME] = "HOUSEKEEPER_02";
constants.NPC_ANIM.NAME[constants.HOUSEKEEPER.BUILDABLEID_5.NAME] = "HOUSEKEEPER_03";

constants.BULLET_TYPE = {
  NONE: null,
  INVISIBLE: 0,
  TRACING: 1,
  LINEAR: 2,
};

constants.BULLET_EXPLOSION_TYPE = {
  NONE: null,
  INVISIBLE: 0,
  SINGLE_TARGET: 1,
  AOE: 2,
};

// NPC battle config. [begins]
constants.NPC_BASE_SPEED = {};
constants.NPC_BASE_VISION_RADIUS = {};
constants.NPC_BASE_DEFENDER_RADIUS = {};
constants.NPC_BASE_HP = {};
constants.NPC_BASE_DAMAGE = {};
constants.NPC_BASE_ATTACK_FPS = {};
constants.NPC_BASE_MOVEMENT_BASE_TIME_SCALE = {}; // If "TIME_SCALE == 2", the animation plays twice as fast as "TIME_SCALE == 1".
constants.NPC_BASE_STAYING_BASE_TIME_SCALE = {};
constants.NPC_BASE_ATTACK_BASE_TIME_SCALE = {}; 
constants.NPC_BULLET_TYPE = {};
constants.NPC_BULLET_DELAYED_SHOOT_MILLIS = {};
constants.NPC_BULLET_EXPLOSION_TYPE = {};
constants.NPC_COOL_DOWN_DROPPING_DURATION_MILLIS = {};
for (var k in constants.NPC_ANIM.NAME) {
  var n = constants.NPC_ANIM.NAME[k];
  switch(n) {
  case constants.NPC_ANIM.NAME.WOLFMAN: 
  constants.NPC_BASE_SPEED[n] = 200;
  constants.NPC_BASE_VISION_RADIUS[n] = 128;
  constants.NPC_BASE_DEFENDER_RADIUS[n] = 64;
  constants.NPC_BASE_HP[n] = 150;
  constants.NPC_BASE_DAMAGE[n] = 30;
  constants.NPC_BASE_ATTACK_FPS[n] = 0.8;
  constants.NPC_BASE_MOVEMENT_BASE_TIME_SCALE[n] = 2.3;
  constants.NPC_BASE_STAYING_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_ATTACK_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BULLET_TYPE[n] = constants.BULLET_TYPE.INVISIBLE;
  constants.NPC_BULLET_DELAYED_SHOOT_MILLIS[n] = 700;
  constants.NPC_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.INVISIBLE;
  constants.NPC_COOL_DOWN_DROPPING_DURATION_MILLIS[n] = 300;
  break;
  case constants.NPC_ANIM.NAME.WITCH: 
  constants.NPC_BASE_SPEED[n] = 150;
  constants.NPC_BASE_VISION_RADIUS[n] = 300;
  constants.NPC_BASE_DEFENDER_RADIUS[n] = 250;
  constants.NPC_BASE_HP[n] = 120;
  constants.NPC_BASE_DAMAGE[n] = 35;
  constants.NPC_BASE_ATTACK_FPS[n] = 0.7;
  constants.NPC_BASE_MOVEMENT_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_STAYING_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_ATTACK_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BULLET_TYPE[n] = constants.BULLET_TYPE.LINEAR;
  constants.NPC_BULLET_DELAYED_SHOOT_MILLIS[n] = 500;
  constants.NPC_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.SINGLE_TARGET;
  constants.NPC_COOL_DOWN_DROPPING_DURATION_MILLIS[n] = 300;
  break;
  case constants.NPC_ANIM.NAME.BOWLCUT: 
  constants.NPC_BASE_SPEED[n] = 80;
  constants.NPC_BASE_VISION_RADIUS[n] = 128;
  constants.NPC_BASE_DEFENDER_RADIUS[n] = 64;
  constants.NPC_BASE_HP[n] = 750;
  constants.NPC_BASE_DAMAGE[n] = 150;
  constants.NPC_BASE_ATTACK_FPS[n] = 0.3;
  constants.NPC_BASE_MOVEMENT_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_STAYING_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_ATTACK_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BULLET_TYPE[n] = constants.BULLET_TYPE.INVISIBLE;
  constants.NPC_BULLET_DELAYED_SHOOT_MILLIS[n] = 700;
  constants.NPC_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.AOE;
  constants.NPC_COOL_DOWN_DROPPING_DURATION_MILLIS[n] = 1000;
  break;
  case constants.NPC_ANIM.NAME.ELFWARRIOR: 
  constants.NPC_BASE_SPEED[n] = 120;
  constants.NPC_BASE_VISION_RADIUS[n] = 350;
  constants.NPC_BASE_DEFENDER_RADIUS[n] = 300;
  constants.NPC_BASE_HP[n] = 450;
  constants.NPC_BASE_DAMAGE[n] = 50;
  constants.NPC_BASE_ATTACK_FPS[n] = 0.5;
  constants.NPC_BASE_MOVEMENT_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_STAYING_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_ATTACK_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BULLET_TYPE[n] = constants.BULLET_TYPE.LINEAR;
  constants.NPC_BULLET_DELAYED_SHOOT_MILLIS[n] = 500;
  constants.NPC_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.SINGLE_TARGET;
  constants.NPC_COOL_DOWN_DROPPING_DURATION_MILLIS[n] = 500;
  break;
  case constants.NPC_ANIM.NAME.ORCWARRIOR: 
  constants.NPC_BASE_SPEED[n] = 150;
  constants.NPC_BASE_VISION_RADIUS[n] = 256;
  constants.NPC_BASE_DEFENDER_RADIUS[n] = 64;
  constants.NPC_BASE_HP[n] = 550;
  constants.NPC_BASE_DAMAGE[n] = 130;
  constants.NPC_BASE_ATTACK_FPS[n] = 0.5;
  constants.NPC_BASE_MOVEMENT_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_STAYING_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_ATTACK_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BULLET_TYPE[n] = constants.BULLET_TYPE.INVISIBLE;
  constants.NPC_BULLET_DELAYED_SHOOT_MILLIS[n] = 700;
  constants.NPC_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.INVISIBLE;
  constants.NPC_COOL_DOWN_DROPPING_DURATION_MILLIS[n] = 1100;
  break;
  case constants.NPC_ANIM.NAME.BIGSHEEP: 
  constants.NPC_BASE_SPEED[n] = 80;
  constants.NPC_BASE_VISION_RADIUS[n] = 256;
  constants.NPC_BASE_DEFENDER_RADIUS[n] = 64;
  constants.NPC_BASE_HP[n] = 400;
  constants.NPC_BASE_DAMAGE[n] = 80;
  constants.NPC_BASE_ATTACK_FPS[n] = 0.5;
  constants.NPC_BASE_MOVEMENT_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_STAYING_BASE_TIME_SCALE[n] = 2.85;
  constants.NPC_BASE_ATTACK_BASE_TIME_SCALE[n] = 2.85;
  constants.NPC_BULLET_TYPE[n] = constants.BULLET_TYPE.INVISIBLE;
  constants.NPC_BULLET_DELAYED_SHOOT_MILLIS[n] = 700;
  constants.NPC_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.INVISIBLE;
  constants.NPC_COOL_DOWN_DROPPING_DURATION_MILLIS[n] = 1000;
  break;
  case constants.NPC_ANIM.NAME.SMALLSHEEP: 
  constants.NPC_BASE_SPEED[n] = 120;
  constants.NPC_BASE_VISION_RADIUS[n] = 256;
  constants.NPC_BASE_DEFENDER_RADIUS[n] = 64;
  constants.NPC_BASE_HP[n] = 300;
  constants.NPC_BASE_DAMAGE[n] = 60;
  constants.NPC_BASE_ATTACK_FPS[n] = 1;
  constants.NPC_BASE_MOVEMENT_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_STAYING_BASE_TIME_SCALE[n] = 5.7;
  constants.NPC_BASE_ATTACK_BASE_TIME_SCALE[n] = 5.7;
  constants.NPC_BULLET_TYPE[n] = constants.BULLET_TYPE.INVISIBLE;
  constants.NPC_BULLET_DELAYED_SHOOT_MILLIS[n] = 700;
  constants.NPC_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.INVISIBLE;
  constants.NPC_COOL_DOWN_DROPPING_DURATION_MILLIS[n] = 1000;
  break;
  default:
  constants.NPC_BASE_SPEED[n] = 0;
  constants.NPC_BASE_VISION_RADIUS[n] = 128;
  constants.NPC_BASE_DEFENDER_RADIUS[n] = 64;
  constants.NPC_BASE_HP[n] = 300;
  constants.NPC_BASE_DAMAGE[n] = 0;
  constants.NPC_BASE_ATTACK_FPS[n] = 0;
  constants.NPC_BASE_MOVEMENT_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_STAYING_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BASE_ATTACK_BASE_TIME_SCALE[n] = 1;
  constants.NPC_BULLET_TYPE[n] = constants.BULLET_TYPE.NONE;
  constants.NPC_BULLET_DELAYED_SHOOT_MILLIS[n] = 0;
  constants.NPC_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.NONE;
  constants.NPC_COOL_DOWN_DROPPING_DURATION_MILLIS[n] = 1000;
  break;
  }
}
// NPC battle config. [ends]

// Buildable battle config. [begins]
constants.BUILDABLE_BASE_ATTACK_FPS = {};
constants.BUILDABLE_ATTACK_FPS_LV_BUFF = {};

constants.BUILDABLE_BULLET_TYPE = {};
constants.BUILDABLE_BULLET_EXPLOSION_TYPE = {};
constants.STATEFUL_BUILDABLE_BASE_VISION_RADIUS = {};
constants.STATEFUL_BUILDABLE_BASE_DEFENDER_RADIUS = {}; // Temporarily same as the "VisionRadius" of each.
for (var k in constants.STATELESS_BUILDABLE_ID) {
  var n = constants.STATELESS_BUILDABLE_ID[k];
  switch(n) {
  case constants.STATELESS_BUILDABLE_ID.FIRE_TOWER:
  constants.BUILDABLE_BASE_ATTACK_FPS[n] = 1.5;
  constants.BUILDABLE_ATTACK_FPS_LV_BUFF[n] = {
    1: 0,
    2: 0.5,
    3: 0.8,
    4: 1.0,
  };
  constants.BUILDABLE_BULLET_TYPE[n] = constants.BULLET_TYPE.TRACING;
  constants.BUILDABLE_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.AOE;
  constants.STATEFUL_BUILDABLE_BASE_VISION_RADIUS[n] = 512;
  constants.STATEFUL_BUILDABLE_BASE_DEFENDER_RADIUS[n] = 512;
  break;
  case constants.STATELESS_BUILDABLE_ID.STONE_TOWER:
  constants.BUILDABLE_BASE_ATTACK_FPS[n] = 0;
  constants.BUILDABLE_ATTACK_FPS_LV_BUFF[n] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };
  constants.BUILDABLE_BULLET_TYPE[n] = constants.BULLET_TYPE.NONE;
  constants.BUILDABLE_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.NONE;
  constants.STATEFUL_BUILDABLE_BASE_VISION_RADIUS[n] = 0;
  constants.STATEFUL_BUILDABLE_BASE_DEFENDER_RADIUS[n] = 0;
  break;
  case constants.STATELESS_BUILDABLE_ID.THUNDER_TOWER:
  constants.BUILDABLE_BASE_ATTACK_FPS[n] = 1.2;
  constants.BUILDABLE_ATTACK_FPS_LV_BUFF[n] = {
    1: 0,
    2: 0.6,
    3: 1.2,
    4: 1.8,
  };
  constants.BUILDABLE_BULLET_TYPE[n] = constants.BULLET_TYPE.INVISIBLE; // It explodes immediately after being shot and creates another AOE bullet.
  constants.BUILDABLE_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.AOE;
  constants.STATEFUL_BUILDABLE_BASE_VISION_RADIUS[n] = 32;
  constants.STATEFUL_BUILDABLE_BASE_DEFENDER_RADIUS[n] = 32;
  break;
  case constants.STATELESS_BUILDABLE_ID.CANNON_TOWER: 
  constants.BUILDABLE_BASE_ATTACK_FPS[n] = 0.4;
  constants.BUILDABLE_ATTACK_FPS_LV_BUFF[n] = {
    1: 0,
    2: 0.2,
    3: 0.4,
    4: 0.6,
  };
  constants.BUILDABLE_BULLET_TYPE[n] = constants.BULLET_TYPE.LINEAR;
  constants.BUILDABLE_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.SINGLE_TARGET;
  constants.STATEFUL_BUILDABLE_BASE_VISION_RADIUS[n] = 500;
  constants.STATEFUL_BUILDABLE_BASE_DEFENDER_RADIUS[n] = 500;
  break;
  default:
  constants.BUILDABLE_BASE_ATTACK_FPS[n] = 0;
  constants.BUILDABLE_ATTACK_FPS_LV_BUFF[n] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  };
  constants.BUILDABLE_BULLET_TYPE[n] = constants.BULLET_TYPE.NONE;
  constants.BUILDABLE_BULLET_EXPLOSION_TYPE[n] = constants.BULLET_EXPLOSION_TYPE.NONE;
  constants.STATEFUL_BUILDABLE_BASE_VISION_RADIUS[n] = 0;
  constants.STATEFUL_BUILDABLE_BASE_DEFENDER_RADIUS[n] = 0;
  break;
  }
}

constants.ATTACKING_NPC_WILL_IGNORE_BUILDABLE_BARRIER_LIST = [
  constants.STATELESS_BUILDABLE_ID.FIRE_TOWER, constants.STATELESS_BUILDABLE_ID.THUNDER_TOWER, constants.STATELESS_BUILDABLE_ID.CANNON_TOWER, constants.STATELESS_BUILDABLE_ID.STONE_TOWER,
  constants.STATELESS_BUILDABLE_ID.FORTRESS,
]; // Such that AttackingNpc won't circumvent it.

constants.WITHOUT_DEFENDING_COLLIDER_DEFENDER_TYPE_BUILDABLE_LIST = [constants.STATELESS_BUILDABLE_ID.STONE_TOWER]; // This doesn't imply "damage == 0".
// Buildable battle config. [ends]

window.constants = constants;
