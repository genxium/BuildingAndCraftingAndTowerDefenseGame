const i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

const pbStructRoot = require('./modules/buildable_proto_bundle.forcemsg.js');
window.buildableLevelConfStruct = pbStructRoot.mineralchem.BuildableLevelConfStruct;
window.syncDataStruct = pbStructRoot.mineralchem.SyncDataStruct;
window.interruptTutorialMaskStruct = pbStructRoot.mineralchem.InterruptTutorialMask;
window.stageInitialState = pbStructRoot.mineralchem.StageInitialState;

const LOGIN_STATE = {
  IDLE: 0,
  LOGGING_IN_BY_GAME_CENTER: 1,
  GAME_CENTER_AUTHENTICATION_FAILED: 2,
  GAME_CENTER_AUTHENTICATED_ABOUT_TO_ACQUIRE_INT_AUTH_TOKEN: 3,
  INT_AUTH_TOKEN_ACQUIRED: 4,
  LOGGING_IN_BY_INT_AUTH_TOKEN: 5,
  INT_AUTH_TOKEN_ACQUISITION_FAILED: 6,
  INT_AUTH_TOKEN_LOGGED_IN: 7,
  LOGGING_IN_BY_ANONMOUS: 8,
};

window.loginSceneScriptIns = null;
window.cachedGameCenterIdentityOfCurrentProcess = null;
window.onGameCenterIdentityObtained = null;
window.onGameCenterIdentityNotObtained = (errCode) => {
  cc.log(`onGameCenterIdentityNotObtained with errCode == ${errCode}`);
  switch (errCode) {
    case 7778:
    case 7779:
      if (window.loginSceneScriptIns) {
        window.loginSceneScriptIns.loginState = LOGIN_STATE.GAME_CENTER_AUTHENTICATION_FAILED;
      }
      break;
    default:
      break;
  }
};

cc.Class({
  extends: cc.Component,

  properties: {
    loadingSprite: {
      type: cc.Sprite,
      default: null,
    },
    loggingInByGameCenterHintLabel: {
      type: cc.Label,
      default: null,
    },
    gameCenterAuthenticationFailedPopup: {
      type: cc.Node,
      default: null,
    },
    loginByAnonymousBtn: {
      default: null,
      type: cc.Button,
    },
    loginTipPrefab: {
      default: null,
      type: cc.Prefab,
    },
    loadingPrefab: {
      default: null,
      type: cc.Prefab,
    },
    anonymousPlayerModeHintPrefab: {
      default: null,
      type: cc.Prefab,
    },
  },

  // LIFE-CYCLE CALLBACKS:
  ctor() {
    this.loginState = LOGIN_STATE.IDLE;
  },

  initAfterConfRead() {
    const self = this;
    let selfPlayer = cc.sys.localStorage.getItem("selfPlayer") ? JSON.parse(cc.sys.localStorage.getItem("selfPlayer")) : null;
    if (window.globalConf && window.globalConf.anonymousPlayerEnabled && selfPlayer && selfPlayer.isAnonymousPlayer) {
      //已有匿名登录信息, 切换服务器地址
      window.backendAddress = window.globalConf.anonymousPlayerEndpoint;
      self.isAnonymousPlayer = true;
    }

    self.checkIntAuthTokenExpire()
      .then((trueOrFalse) => {
        if (true == trueOrFalse) {
          self.loginState = LOGIN_STATE.LOGGING_IN_BY_INT_AUTH_TOKEN;
          const intAuthToken = selfPlayer.intAuthToken;
          self.useTokenLogin(intAuthToken);
        } else {
          self.useGameCenterLogin();
        }
      }
    );
  },

  onLoad() {
    const self = this;
    window.shouldTipOfWsDisconnected = true;
    if (null == window.enabledDialogs) {
      window.enabledDialogs = [];
    }
    window.backendAddress = window.mainServerBackendAddress;
    const gameCenterLoginNode = self.node;
    self.gameCenterLoginNode = gameCenterLoginNode;
    window.loginSceneScriptIns = self;
    self.loginState = LOGIN_STATE.IDLE;
    self.isAnonymousPlayer = false;
    self.getRetCodeList();

    /** Initialization of loginByAnonymousBtn [BEGINS]**/
    const loginByAnonymousButtonOnClickHandler = new cc.Component.EventHandler();
    loginByAnonymousButtonOnClickHandler.target = gameCenterLoginNode;
    loginByAnonymousButtonOnClickHandler.component = "GameCenterLogin";
    loginByAnonymousButtonOnClickHandler.handler = "onLoginByAnonymousBtnClicked";
    this.loginByAnonymousBtn.clickEvents = [loginByAnonymousButtonOnClickHandler];

    /** Initialization of loginByAnonymousBtn [ENDS]**/
    const anonymousPlayerModeHintNode = cc.instantiate(self.anonymousPlayerModeHintPrefab);
    anonymousPlayerModeHintNode.active = false;
    safelyAddChild(self.node, anonymousPlayerModeHintNode);
    self.anonymousPlayerModeHintNode = anonymousPlayerModeHintNode;
    const anonymousPlayerModeHintScriptIns = anonymousPlayerModeHintNode.getComponent("AnonymousPlayerModeHint");
    anonymousPlayerModeHintScriptIns.updateBindData(self.node);
    anonymousPlayerModeHintScriptIns.onCloseDelegate = () => {
      self.loginByAnonymousBtn.interactable = true;
    }
    /** Initialization of AnonymousPlayerModeHintNode [ENDS]**/

    window.onDarwinDeviceUuidObtained = function(uuid) {
      cc.log(`Obtained DarwinDeviceUuid == ${uuid}.`);
      self.sendAnonymousLogin(uuid);
    }

    let networkDisconnectedDialogPrefab = self.loginTipPrefab;
    let parentNode = self.node;
    window.cleanupAndGoBackToLoginSceneAnyway = function() {
      if (null != cc.sys.localStorage.getItem('selfPlayer')) {
        cc.sys.localStorage.removeItem('selfPlayer');
      } 
      cc.director.loadScene('GameCenterLogin');
      window.closeWSConnection();
    };
    window.handleNetworkDisconnected = function(specifiedParentNode, specifiedSimplePressToGoDialog) {
      cc.log("Begins calling `window.handleNetworkDisconnected`");
      if (false == window.shouldTipOfWsDisconnected) {
        // 用于判断是不是主动退出登录, 和防止onclose & onerror同时触发导致的双重popup
        return;
      }
      if (null != window.loginSceneScriptIns) {
        window.loginSceneScriptIns.loginState = LOGIN_STATE.IDLE;
      }
      if (null != specifiedParentNode) {
        parentNode = specifiedParentNode; 
      }
      if (null != specifiedSimplePressToGoDialog) {
        networkDisconnectedDialogPrefab = specifiedSimplePressToGoDialog; 
      }
      if (null != parentNode && null != networkDisconnectedDialogPrefab) {
        try {
          const simplePressToGoDialogNode = cc.instantiate(networkDisconnectedDialogPrefab);
          simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
          const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
          simplePressToGoDialogScriptIns.setHintLabel(i18n.t("network.disconnected"));
          simplePressToGoDialogScriptIns.setYesButtonLabel(i18n.t("bichoiceDialog.yes"));
          simplePressToGoDialogScriptIns.defaultActionsEnabled = false;
          simplePressToGoDialogScriptIns.onCloseDelegate = () => {
            window.cleanupAndGoBackToLoginSceneAnyway();
          };
          safelyAddChild(parentNode, simplePressToGoDialogNode);
          setLocalZOrder(simplePressToGoDialogNode, window.CORE_LAYER_Z_INDEX.INFINITY);
        } catch (e) {
          window.cleanupAndGoBackToLoginSceneAnyway();
        }
      } else {
        window.cleanupAndGoBackToLoginSceneAnyway();
      }
      window.shouldTipOfWsDisconnected = false;
      return;
    };

    window.handleTokenExpired = function(specifiedParentNode, specifiedSimplePressToGoDialog) {
      if (false == window.shouldTipOfWsDisconnected) { //用于判断是不是主动退出登录, 和防止onClose& on error同时触发导致的双重popup
        return;
      }
      if (null != window.loginSceneScriptIns) {
        window.loginSceneScriptIns.loginState = LOGIN_STATE.IDLE;
      }
      if (null != specifiedParentNode) {
        parentNode = specifiedParentNode; 
      }
      if (null != specifiedSimplePressToGoDialog) {
        networkDisconnectedDialogPrefab = specifiedSimplePressToGoDialog; 
      }
      if (null != parentNode && null != networkDisconnectedDialogPrefab) {
        try {
          const simplePressToGoDialogNode = cc.instantiate(networkDisconnectedDialogPrefab);
          simplePressToGoDialogNode.setPosition(cc.v2(0, 0));
          const simplePressToGoDialogScriptIns = simplePressToGoDialogNode.getComponent("SimplePressToGoDialog");
          simplePressToGoDialogScriptIns.defaultActionsEnabled = false;
          simplePressToGoDialogScriptIns.setHintLabel(i18n.t("network.tokenExpired"));
          simplePressToGoDialogScriptIns.setYesButtonLabel(i18n.t("bichoiceDialog.yes"));
          simplePressToGoDialogScriptIns.onCloseDelegate = () => {
            window.cleanupAndGoBackToLoginSceneAnyway();  
          };
          safelyAddChild(parentNode, simplePressToGoDialogNode);
          setLocalZOrder(simplePressToGoDialogNode, window.CORE_LAYER_Z_INDEX.INFINITY);
        } catch (e) {
          window.cleanupAndGoBackToLoginSceneAnyway();  
        }
      } else {
        window.cleanupAndGoBackToLoginSceneAnyway();  
      }
      window.shouldTipOfWsDisconnected = false;
      return;
    };

    self.sendGlobalConfRead();
  },

  getRetCodeList() {
    const self = this;
    self.retCodeDict = constants.RET_CODE;
  },

  checkIntAuthTokenExpire() {
    return new Promise((resolve, reject) => {
      if (null == cc.sys.localStorage.getItem("selfPlayer")) {
        cc.log("Within `checkIntAuthTokenExpire`, there is no `selfPlayer` cached in localStorage.")
        resolve(false);
      } else {
        const selfPlayer = JSON.parse(cc.sys.localStorage.getItem("selfPlayer"));
        (selfPlayer.intAuthToken && new Date().getTime() < selfPlayer.expiresAt) ? resolve(true) : resolve(false);
      }
    });
  },

  useTokenLogin(_intAuthToken) {
    const self = this;
    self.loginState = LOGIN_STATE.LOGGING_IN_BY_INT_AUTH_TOKEN;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.INT_AUTH_TOKEN + constants.ROUTE_PATH.LOGIN,
      type: "POST",
      data: {
        intAuthToken: _intAuthToken
      },
      success: function(resp) {
        self.onLoggedIn(resp)
      },
      error: function(err) {
        cc.log(`IntAuthTokenLogin request is responded with error ${err}`);
        if (window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.node, self.loginTipPrefab);
        }
      },
      timeout: function() {
        cc.log(`IntAuthTokenLogin request is timed out.`);
        if (window.handleNetworkDisconnected) {
          window.handleNetworkDisconnected(self.node, self.loginTipPrefab);
        }
      }
    });
  },

  actuallyUseCachedGameCenterIdentityToLogin() {
    const self = this;
    self.loginState = LOGIN_STATE.GAME_CENTER_AUTHENTICATED_ABOUT_TO_ACQUIRE_INT_AUTH_TOKEN;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.GAME_CENTER + constants.ROUTE_PATH.LOGIN,
      type: 'POST',
      data: {
        playerId: window.cachedGameCenterIdentityOfCurrentProcess.playerId,
        publicKeyUrl: window.cachedGameCenterIdentityOfCurrentProcess.publicKeyUrl,
        signatureB64Encoded: window.cachedGameCenterIdentityOfCurrentProcess.signatureB64Encoded,
        saltB64Encoded: window.cachedGameCenterIdentityOfCurrentProcess.saltB64Encoded,
        timestamp: window.cachedGameCenterIdentityOfCurrentProcess.timestamp,
      },
      success: function(res) {
        switch (res.ret) {
          case constants.RET_CODE.OK:
            self.loginState = LOGIN_STATE.INT_AUTH_TOKEN_ACQUIRED;
            self.useTokenLogin(res.intAuthToken);
            break;
          default:
            cc.log(`GameCenterLogin request is responded with res.ret == ${res.ret}`);
            self.loginState = LOGIN_STATE.INT_AUTH_TOKEN_ACQUISITION_FAILED;
            break;
        }
      },
      error: function(err) {
        self.loginState = LOGIN_STATE.INT_AUTH_TOKEN_ACQUISITION_FAILED;
        cc.log(`GameCenterLogin request is responded with error ${err}`);
      },
      timeout: function() {
        self.loginState = LOGIN_STATE.INT_AUTH_TOKEN_ACQUISITION_FAILED;
        cc.log(`Using GameCenterIdentity to acquire IntAuthToken request is timed out.`);
      },
    });
  },

  sendGlobalConfRead() {
    const self = this;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.GLOBAL + constants.ROUTE_PATH.AUTH_CONF + constants.ROUTE_PATH.QUERY,
      type: 'GET',
      data: {},
      success: function(res) {
        if (constants.RET_CODE.OK != res.ret) {
          cc.warn("globalConfRead fails and ret == ", res.ret);
        } else {
          window.globalConf = res;
          cc.log(`window.globalConf == ${JSON.stringify(window.globalConf)}`);
        }
        self.initAfterConfRead();
      },
      error: function(err) {
        // 无网络或网络环境非常差的时候不要尝试`self.initAfterConfRead`, 待玩家在相应的popup/dialog中点击确定即会load/reload GameCenterLoginScene。
      },
      timeout: function() {
        // 无网络或网络环境非常差的时候不要尝试`self.initAfterConfRead`, 待玩家在相应的popup/dialog中点击确定即会load/reload GameCenterLoginScene。
      },
    });


  },

  sendAnonymousLogin(uuid) {
    const self = this;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.ANONYMOUS + constants.ROUTE_PATH.DARWIN + constants.ROUTE_PATH.UUID + constants.ROUTE_PATH.LOGIN,
      type: 'POST',
      data: {
        deviceUuid: uuid
      },
      success: function(res) {
        switch (res.ret) {
          case constants.RET_CODE.OK:
            self.loginState = LOGIN_STATE.INT_AUTH_TOKEN_ACQUIRED;
            self.useTokenLogin(res.intAuthToken);
            break;
          default:
            cc.log(`Anonmous request is responded with res.ret == ${res.ret}`);
            self.loginState = LOGIN_STATE.INT_AUTH_TOKEN_ACQUISITION_FAILED;
            break;
        }
      },
      error: function(err) {
        self.loginState = LOGIN_STATE.INT_AUTH_TOKEN_ACQUISITION_FAILED;
        cc.log(`GameCenterLogin request is responded with error ${err}`);
      },
      timeout: function() {
        self.loginState = LOGIN_STATE.INT_AUTH_TOKEN_ACQUISITION_FAILED;
        cc.log(`Using anonymousLogin to acquire IntAuthToken request is timed out.`);
      },
    });
  },

  useAnonymousLogin(evt) {
    const self = this;
    self.loginState = LOGIN_STATE.LOGGING_IN_BY_ANONMOUS;
    self.isAnonymousPlayer = true;
    window.backendAddress = window.globalConf.anonymousPlayerEndpoint;
    try {
      if (CuisineMaster && CuisineMaster.DarwinDevice) {
        CuisineMaster.DarwinDevice.queryDarwinDeviceUuid();
      } else {
        cc.warn("No required namespace `CuisineMaster`.");
      }
    } catch (e) {
      cc.error(e);
    }
  },

  useGameCenterLogin() {
    cc.log("GameCenterLogin.useGameCenterLogin begins");
    const self = this;
    window.backendAddress = window.mainServerBackendAddress; //重置backendAddress
    try {
      if (CuisineMaster && CuisineMaster.GameCenter && null == window.cachedGameCenterIdentityOfCurrentProcess) {
        self.loginState = LOGIN_STATE.LOGGING_IN_BY_GAME_CENTER;
        window.onGameCenterIdentityObtained = function(playerId, publicKeyUrl, signature, salt, timestamp) {
          cc.log("onGameCenterIdentityObtained");
          cc.log("playerId: " + playerId);
          cc.log("publicKeyUrl: " + publicKeyUrl);
          cc.log("signature: " + signature);
          cc.log("salt: " + salt);
          cc.log("timestamp: " + timestamp);
          self.loginByAnonymousBtn.node.active = false;
          self.gameCenterAuthenticationFailedPopup.active = false;
          self.anonymousPlayerModeHintNode.active = false;
          window.cachedGameCenterIdentityOfCurrentProcess = {
            playerId: playerId,
            publicKeyUrl: publicKeyUrl,
            signatureB64Encoded: signature,
            saltB64Encoded: salt,
            timestamp: timestamp,
          };
          self.actuallyUseCachedGameCenterIdentityToLogin();
        };
        CuisineMaster.GameCenter.authenticate();
      } else {
        self.actuallyUseCachedGameCenterIdentityToLogin();
      }
    } catch (e) {
      cc.log(e);
    }
  },

  onLoggedIn(res) {
    const self = this;
    cc.log(`OnLoggedIn ${JSON.stringify(res)}.`)
    if (res.ret === constants.RET_CODE.OK) {
      self.loginState = LOGIN_STATE.INT_AUTH_TOKEN_LOGGED_IN;
      const date = Number(res.expiresAt);
      const selfPlayer = {
        expiresAt: date,
        playerId: res.playerId,
        intAuthToken: res.intAuthToken,
        isAnonymousPlayer: self.isAnonymousPlayer,
      }
      cc.sys.localStorage.setItem("selfPlayer", JSON.stringify(selfPlayer));
      if (self.countdownTimer) {
        clearInterval(self.countdownTimer);
      }
      // Showing progressBar when load scene[begin]
      self.loadingNode = cc.instantiate(self.loadingPrefab);
      safelyAddChild(self.node, self.loadingNode);
      let progressBarNode = self.loadingNode.getChildByName('loadingProgress'),
          progressBarIns = null,
          progressTween = null;
      if (null != progressBarNode) {
        self.loadingNode.getChildByName('loadingSprite').active = false;
        progressBarIns = progressBarNode.getComponent(cc.ProgressBar);
        progressBarIns.progress = 0;
        progressTween = cc.tween(progressBarIns).to(constants.DURATION_MILLIS.PROGRESS_LOADING / 1000, { progress: 0.8 });
        progressTween.start();
      } else {
        self.loadingNode.getChildByName('loadingSprite').runAction(
          cc.repeatForever(cc.rotateBy(1.0, 360))
        );
      }
      cc.director.preloadScene("BuildableMap", function(completedCount, totalCount, item) {}, function() {
        progressTween.stop();
        progressTween = cc.tween(progressBarIns).
          to(constants.DURATION_MILLIS.PROGRESS_LOADED / 1000, { progress: 1 }).
          call(() => {
            cc.director.loadScene("BuildableMap");
          });
        progressTween.start();
      });
      // Showing progressBar when load scene [end].
    } else {
      self.loginState = LOGIN_STATE.INT_AUTH_TOKEN_ACQUISITION_FAILED;
      switch (res.ret) {
        case constants.RET_CODE.DUPLICATED:
          cc.log(`Error code: DUPLICATED`);
          // TODO: Show GUI tips.
          break;
        case this.retCodeDict.INVALID_TOKEN:
          cc.log(`Error code: INVALID_TOKEN`);
          // TODO: Show GUI tips.
          break;
        default:
          break;
      }
    }
  },

  onLoginByAnonymousBtnClicked(evt) {
    const self = this;
    self.loginByAnonymousBtn.interactable = false; //active = true由closeDelegate触发
    self.anonymousPlayerModeHintNode.active = true;
    safelyAddChild(self.gameCenterLoginNode, self.anonymousPlayerModeHintNode);
  },

  update(dt) {
    const self = this;
    const nRunningActions = self.loadingSprite.node.getNumberOfRunningActions();
    switch (self.loginState) {
      case LOGIN_STATE.IDLE:
        self.loadingSprite.node.active = false;
        self.gameCenterAuthenticationFailedPopup.active = false;
        self.anonymousPlayerModeHintNode.active = false;
        break;
      case LOGIN_STATE.LOGGING_IN_BY_GAME_CENTER:
        self.loginByAnonymousBtn.node.active = false;
        self.anonymousPlayerModeHintNode.active = false;
        self.gameCenterAuthenticationFailedPopup.active = false;
        self.loadingSprite.node.active = false;
      case LOGIN_STATE.GAME_CENTER_AUTHENTICATED_ABOUT_TO_ACQUIRE_INT_AUTH_TOKEN:
      case LOGIN_STATE.INT_AUTH_TOKEN_ACQUIRED:
      case LOGIN_STATE.LOGGING_IN_BY_ANONMOUS:
        self.loginByAnonymousBtn.node.active = false;
        self.anonymousPlayerModeHintNode.active = false;
        self.gameCenterAuthenticationFailedPopup.active = false;
        self.loadingSprite.node.active = true;
        if (0 >= nRunningActions) {
          self.loadingSprite.node.runAction(
            cc.repeatForever(cc.rotateBy(1.0, 360))
          );
        } else {
          self.loadingSprite.node.resumeAllActions();
        }
        break;
      case LOGIN_STATE.LOGGING_IN_BY_INT_AUTH_TOKEN:
        self.loginByAnonymousBtn.node.active = false;
        self.anonymousPlayerModeHintNode.active = false;
        self.loadingSprite.node.active = true;
        if (0 >= nRunningActions) {
          self.loadingSprite.node.runAction(
            cc.repeatForever(cc.rotateBy(1.0, 360))
          );
        } else {
          self.loadingSprite.node.resumeAllActions();
        }
        self.gameCenterAuthenticationFailedPopup.active = false;
        self.anonymousPlayerModeHintNode.active = false;
        break;
      case LOGIN_STATE.GAME_CENTER_AUTHENTICATION_FAILED:
        if (window.globalConf && window.globalConf.anonymousPlayerEnabled) {
          self.loginByAnonymousBtn.node.active = true;
        } else {
          self.gameCenterAuthenticationFailedPopup.active = true;
        }
        self.loadingSprite.node.active = false;
        break;
      case LOGIN_STATE.INT_AUTH_TOKEN_ACQUISITION_FAILED:
        if (self.isAnonymousPlayer) {
          self.loginByAnonymousBtn.node.active = true; //Allows the user to re-login.
        } else {
          self.useGameCenterLogin();
        }
        self.loadingSprite.node.active = false;
        self.gameCenterAuthenticationFailedPopup.active = false;
        break;
      case LOGIN_STATE.INT_AUTH_TOKEN_LOGGED_IN:
        self.loginByAnonymousBtn.node.active = false;
        self.loadingSprite.node.active = false;
        self.gameCenterAuthenticationFailedPopup.active = false;
        self.anonymousPlayerModeHintNode.active = false;
        break;
      default:
        break;
    }
  },
});
