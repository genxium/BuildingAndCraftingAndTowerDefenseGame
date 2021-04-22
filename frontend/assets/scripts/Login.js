const i18n = require('LanguageData');
i18n.init(window.language); // languageID should be equal to the one we input in New Language ID input field

const pbStructRoot = require('./modules/buildable_proto_bundle.forcemsg.js');
window.buildableLevelConfStruct = pbStructRoot.mineralchem.BuildableLevelConfStruct;
window.syncDataStruct = pbStructRoot.mineralchem.SyncDataStruct;
window.interruptTutorialMaskStruct = pbStructRoot.mineralchem.InterruptTutorialMask;
window.stageInitialState = pbStructRoot.mineralchem.StageInitialState;

window.admobOnRewardedAdOpened = function() {
  console.log("admobOnRewardedAdOpened");
};

window.admobOnRewardedAdClosed = function() {
  console.log("admobOnRewardedAdClosed");
};

window.admobOnRewardedAdFailedToShow = function() {
  console.log("admobOnRewardedAdFailedToShow");
};

window.admobOnUserEarnedReward = function() {
  console.log("admobOnUserEarnedReward");
};

window.onLoggedInByGoogle = function(ggAuthId, ggAuthIdToken, errStr) {
  console.log("onAuthenticatedByGoogle", ggAuthId, ggAuthIdToken);
  if (null != ggAuthId && null != ggAuthIdToken) {
    if (null != window.loginSceneScriptIns) {
      window.loginSceneScriptIns.sendGoogleAuthCredentialsToBackend(ggAuthId, ggAuthIdToken);
    }
  } else {
    if (null != window.loginSceneScriptIns) {
      window.loginSceneScriptIns.enableInteractiveControls(true);
    }
  }
};

window.ttShareImageUrl = "https://sf1-ttcdn-tos.pstatp.com/obj/developer/app/tt266c50d1b94607ef/icon4b164ac"; // Configured in the management console of specific app in ByteDanceDeveloper. 

window.admobOnRewardedAdFailedToLoad = function(admobErrorCode) {
  /*
  * See the list of "admobErrorCode" enums here https://developers.google.com/android/reference/com/google/android/gms/ads/AdRequest#ERROR_CODE_INTERNAL_ERROR.
  */
  console.log("admobOnRewardedAdFailedToLoad, admobErrorCode == ", admobErrorCode);
};

window.admobOnRewardedAdJustStartedLoading = function() {
  console.log("admobOnRewardedAdJustStartedLoading");
}; 


cc.Class({
  extends: cc.Component,

  properties: {
    cavasNode: {
      default: null,
      type: cc.Node
    },
    backgroundNode: {
      default: null,
      type: cc.Node
    },
    interactiveControls: {
      default: null,
      type: cc.Node
    },
    phoneCountryCodeInput: {
      default: null,
      type: cc.Node
    },
    phoneNumberInput: {
      type: cc.Node,
      default: null
    },
    phoneNumberTips: {
      type: cc.Node,
      default: null
    },
    smsLoginCaptchaInput: {
      type: cc.Node,
      default: null
    },
    smsLoginCaptchaButton: {
      type: cc.Node,
      default: null
    },
    captchaTips: {
      type: cc.Node,
      default: null
    },
    loginButton: {
      type: cc.Node,
      default: null
    },
    smsWaitCountdownPrefab: {
      default: null,
      type: cc.Prefab
    },
    loadingPrefab: {
      default: null,
      type: cc.Prefab
    },
    loginTipPrefab: {
      default: null,
      type: cc.Prefab
    },
    useIdleGameMap: false,
    smsSection: {
      default: null,
      type: cc.Node
    },
    anonymousSection: {
      default: null,
      type: cc.Node
    },
    googleSection: {
      default: null,
      type: cc.Node
    },
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    const self = this;
    if (null != window.tt) {
      tt.hideShareMenu();
      tt.onShareAppMessage((channel) => {
        const ttToShareMessage = {
          title: i18n.t("ByteDanceGameTitle"),
          imageUrl: window.ttShareImageUrl,
          success() {
            console.log("分享成功");
          },
          fail(e) {
            console.log("分享失败", e);
          }
        };
        console.warn("The ttToShareMessage for sharing: ", ttToShareMessage, ", for channel: ", channel);
        return ttToShareMessage;
      });
    } else {
      if (cc.sys.platform == cc.sys.WECHAT_GAME) {
        const wxToShareMessage = {
          title: i18n.t('GameTitle'),
          imageUrl: window.wxShareImageUrl,  
          imageUrlId: window.wxShareImageId,  
        };
        wx.showShareMenu();
        wx.onShareAppMessage(() => {
          return wxToShareMessage;
        });
      }
    }

    window.loginSceneScriptIns = self;
    if (null == window.enabledDialogs) {
      window.enabledDialogs = [];
    }
    window.shouldTipOfWsDisconnected = true;
    window.resizeCallback = (canvasNode) => {
      cc.view.setResizeCallback(function() {
        canvasNode.width = document.body.clientWidth;
        canvasNode.height = document.body.clientHeight;
        cc.log("canvas node changed, and changed node's size is " + canvasNode.width + ", " + canvasNode.height);
        cc.log("client device's size is " + document.body.clientWidth + ", " + document.body.clientHeight);
        cc.log("design resolution: " + canvasNode.getComponent(cc.Canvas).designResolution);
      });
    }
    self.getRetCodeList();
    self.getRegexList();

    let networkDisconnectedDialogPrefab = self.loginTipPrefab;
    let parentNode = self.node;

    window.cleanupAndGoBackToLoginSceneAnyway = function() {
      cc.sys.localStorage.removeItem('selfPlayer');
      cc.sys.localStorage.removeItem('targetPlayerId');
      cc.director.loadScene('Login');
      window.closeWSConnection();
    };

    window.handleNetworkDisconnected = function(specifiedParentNode, specifiedSimplePressToGoDialog) {
      if (false == window.shouldTipOfWsDisconnected) { //用于判断是不是主动退出登录, 和防止onClose& on error同时触发导致的双重popup
        return;
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
          simplePressToGoDialogScriptIns.setHintLabel(i18n.t("network.disconnected"));
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

    window.handleTokenExpired = function(specifiedParentNode, specifiedSimplePressToGoDialog) {
      if (false == window.shouldTipOfWsDisconnected) { //用于判断是不是主动退出登录, 和防止onClose& on error同时触发导致的双重popup
        return;
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

    self.checkPhoneNumber = self.checkPhoneNumber.bind(self);
    self.checkIntAuthTokenExpire = self.checkIntAuthTokenExpire.bind(self);
    self.checkCaptcha = self.checkCaptcha.bind(self);
    self.onSMSCaptchaObtainButtonClicked = self.onSMSCaptchaObtainButtonClicked.bind(self);
    self.smsLoginCaptchaButton.on('click', self.onSMSCaptchaObtainButtonClicked);
    self.loadingNode = cc.instantiate(this.loadingPrefab);

    if (null != window.tt) {
      // Using ByteDanceMinigame platforms.
      self.onAnonymousLoginButtonClicked();
    } else {
      self.checkIntAuthTokenExpire().then(
        () => {
          const intAuthToken = JSON.parse(cc.sys.localStorage.getItem("selfPlayer")).intAuthToken;
          self.useTokenLogin(intAuthToken);
        },
        () => {
          // TODO: Handle expired intAuthToken appropriately.
          self.enableInteractiveControls(true);
        }
      );
    }
    this.smsGetCaptchaNode = this.smsLoginCaptchaButton.getChildByName('smsGetCaptcha');
    this.smsWaitCountdownNode = cc.instantiate(this.smsWaitCountdownPrefab);

    let scale = Math.max(self.node.width / self.backgroundNode.width, self.node.height / self.backgroundNode.height);
    if (isNaN(scale) || 0 == scale) {
      self.backgroundNode.width = self.node.width;
      self.backgroundNode.height = self.node.height;
    } else {
      self.backgroundNode.width = self.backgroundNode.width * scale;
      self.backgroundNode.height = self.backgroundNode.height * scale;
    }
    
  },

  isPurelyVisual() {
    const self = this;
    if (self.showingPopup) {
      return false;
    } else {
      return true;
    }
  },
  removePopup() {
    const self = this;
    self.showingPopup = false;
  },
  addPopup() {
    const self = this;
    self.showingPopup = true;
  },
  getRetCodeList() {
    const self = this;
    self.retCodeDict = constants.RET_CODE;
  },

  getRegexList() {
    const self = this;
    self.regexList = {
      EMAIL: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      PHONE: /^\+?[0-9]{8,14}$/,
      STREET_META: /^.{5,100}$/,
      LNG_LAT_TEXT: /^[0-9]+(\.[0-9]{4,6})$/,
      SEO_KEYWORD: /^.{2,50}$/,
      PASSWORD: /^.{6,50}$/,
      SMS_CAPTCHA_CODE: /^[0-9]{4}$/,
      ADMIN_HANDLE: /^.{4,50}$/,
    };
  },

  onSMSCaptchaObtainButtonClicked(evt) {
    var timerEnable = true;
    const self = this;
    if (!self.isPurelyVisual()) return;
    if (!self.checkPhoneNumber('getCaptcha')) {
      return;
    }
    window.shouldTipOfWsDisconnected = true;
    if (timerEnable) {
      self.countdownTime(self);
    }
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API +
        constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.SMS_CAPTCHA + constants.ROUTE_PATH.OBTAIN,
      type: 'GET',
      data: {
        phoneCountryCode: self.phoneCountryCodeInput.getComponent(cc.EditBox).string,
        phoneNum: self.phoneNumberInput.getComponent(cc.EditBox).string
      },
      error: function(res) {
        window.handleNetworkDisconnected(self.node, self.loginTipPrefab);
        self.enableInteractiveControls(false);
      },
      timeout: function(res) {
        window.handleNetworkDisconnected(self.node, self.loginTipPrefab);
        self.enableInteractiveControls(false);
      },
      success: function(res) {
        switch (res.ret) {
          case self.retCodeDict.OK:
            self.phoneNumberTips.getComponent(cc.Label).string = '';
            break;
          case self.retCodeDict.DUPLICATED:
            self.phoneNumberTips.getComponent(cc.Label).string = constants.ALERT.TIP_LABEL.LOG_OUT;
            break;
          case self.retCodeDict.INCORRECT_PHONE_COUNTRY_CODE_OR_NUMBER:
            self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.PHONE_ERR");
            break;
          case self.retCodeDict.IS_TEST_ACC:
            self.smsLoginCaptchaInput.getComponent(cc.EditBox).string = res.smsLoginCaptcha;
            self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.TEST_USER");
            break;
          case self.retCodeDict.SMS_CAPTCHA_REQUESTED_TOO_FREQUENTLY:
            self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.SMS_CAPTCHA_FREQUENT_REQUIRE");
            break;
          case self.retCodeDict.INVALID_REQUEST_PARAM:
            self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.INCORRECT_PHONE_NUMBER");
            break;
          default:
            break;
        }
      }
    });
  },

  countdownTime(self) {
    self.smsLoginCaptchaButton.off('click', self.onSMSCaptchaObtainButtonClicked);
    self.smsLoginCaptchaButton.removeChild(self.smsGetCaptchaNode);
    
    self.smsWaitCountdownNode.parent = self.smsLoginCaptchaButton;
    let total = 20; // Magic number
    self.countdownTimer = setInterval(function() {
      if (0 == total) {
        clearInterval(self.countdownTimer);

        if (self.smsWaitCountdownNode && self.smsWaitCountdownNode.parent) {
          self.smsWaitCountdownNode.removeFromParent();
          self.smsWaitCountdownNode.getChildByName('WaitTimeLabel').getComponent(cc.Label).string = 20;
        }
        safelyAddChild(self.smsLoginCaptchaButton, self.smsGetCaptchaNode);
        self.smsLoginCaptchaButton.on('click', self.onSMSCaptchaObtainButtonClicked);
      } else {
        total--;
        if (self.smsWaitCountdownNode) {
          self.smsWaitCountdownNode.getChildByName('WaitTimeLabel').getComponent(cc.Label).string = total;
        }
      }
    }, 1000)

  },

  checkIntAuthTokenExpire() {
    return new Promise((resolve, reject) => {
      if (!cc.sys.localStorage.getItem("selfPlayer")) {
        reject();
        return;
      }
      const selfPlayer = JSON.parse(cc.sys.localStorage.getItem("selfPlayer"));
      (selfPlayer.intAuthToken && new Date().getTime() < selfPlayer.expiresAt) ? resolve() : reject();
    })
  },

  checkPhoneNumber(type) {
    const self = this;
    const phoneNumberRegexp = self.regexList.PHONE;
    var phoneNumberString = self.phoneNumberInput.getComponent(cc.EditBox).string;
    if (phoneNumberString) {
      //TODO DEMO阶段，由后端校验手机号格式，过滤测试账号
      return true;
      if (!phoneNumberRegexp.test(phoneNumberString)) {
        self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.PHONE_ERR");
        return false;
      } else {
        return true;
      }
    } else {
      if (type === 'getCaptcha' || type === 'login') {
        self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.PHONE_ERR");
      }
      return false;
    }
  },

  checkCaptcha(type) {
    const self = this;
    const captchaRegexp = self.regexList.SMS_CAPTCHA_CODE;
    var captchaString = self.smsLoginCaptchaInput.getComponent(cc.EditBox).string;

    if (captchaString) {
      if (self.smsLoginCaptchaInput.getComponent(cc.EditBox).string.length !== 4 || (!captchaRegexp.test(captchaString))) {
        self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.CAPTCHA_ERR");
        return false;
      } else {
        return true;
      }
    } else {
      if (type === 'login') {
        self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.CAPTCHA_ERR");
      }
      return false;
    }
  },

  useTokenLogin(_intAuthToken) {
    var self = this;
    window.shouldTipOfWsDisconnected = true;
    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.INT_AUTH_TOKEN + constants.ROUTE_PATH.LOGIN,
      type: "POST",
      data: {
        intAuthToken: _intAuthToken
      },
      success: function(resp) {
        self.onLoggedIn(resp)
      },
      timeout: function() {
        self.enableInteractiveControls(true);
      },
      error: function() {
        self.enableInteractiveControls(true);
      },
    });
  },

  enableInteractiveControls(enabled) {
    this.smsLoginCaptchaButton.getComponent(cc.Button).interactable = enabled;
    this.loginButton.getComponent(cc.Button).interactable = enabled;
    this.phoneCountryCodeInput.getComponent(cc.EditBox).enabled = enabled;
    this.phoneNumberInput.getComponent(cc.EditBox).enabled = enabled;
    this.smsLoginCaptchaInput.getComponent(cc.EditBox).enabled = enabled;
    if (enabled) {
      setVisible(this.interactiveControls);
      // this.anonymousSection.active = true;
    } else {
      setInvisible(this.interactiveControls);
    }
  },

  onLoginButtonClicked(evt) {
    const self = this;
    if (!self.isPurelyVisual()) return;
    if (!self.checkPhoneNumber('login') || !self.checkCaptcha('login')) {
      return;
    }
    self.loginParams = {
      phoneCountryCode: self.phoneCountryCodeInput.getComponent(cc.EditBox).string,
      phoneNum: self.phoneNumberInput.getComponent(cc.EditBox).string,
      smsLoginCaptcha: self.smsLoginCaptchaInput.getComponent(cc.EditBox).string
    };
    self.enableInteractiveControls(false);
    window.shouldTipOfWsDisconnected = true;

    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.SMS_CAPTCHA + constants.ROUTE_PATH.LOGIN,
      type: "POST",
      data: self.loginParams,
      success: function(resp) {
        self.onLoggedIn(resp);
      },
      timeout: function() {
        self.enableInteractiveControls(true);
      },
      error: function() {
        self.enableInteractiveControls(true);
      },
    });
  },

  sendGoogleAuthCredentialsToBackend(ggAuthId, ggAuthIdToken) {
    const self = this;
    self.loginParams = {
      ggAuthId: ggAuthId,
      ggAuthIdToken: ggAuthIdToken,
    };

    NetworkUtils.ajax({
      url: backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.GOOGLE_AUTH + constants.ROUTE_PATH.LOGIN,
      type: "POST",
      data: self.loginParams,
      success: function(resp) {
        self.onLoggedIn(resp);
      },
      timeout: function() {
        self.enableInteractiveControls(true);
      }, 
      error: function() {
        self.enableInteractiveControls(true);
      },
    });
  },

  onGoogleAuthLoginButtonClicked(evt) {
    if (null == jsb) return;
    const self = this;
    if (!self.isPurelyVisual()) return;
    self.enableInteractiveControls(false);
    window.shouldTipOfWsDisconnected = true;
    
    jsb.reflection.callStaticMethod("org/cocos2dx/javascript/authpayment/ApHelper", "signInByGoogle", "()V");
  },

  onAnonymousLoginButtonClicked(evt) {
    const self = this;
    const isUsingByteDance = true; // Hardcoded temporarily -- YFLu, 2019-11-28.
    let url = null;
    if (true == isUsingByteDance) {
      url = backendAddress.PROTOCOL + '://' + backendAddress.HOST + ':' + backendAddress.PORT + constants.ROUTE_PATH.API + constants.ROUTE_PATH.VERSION + constants.ROUTE_PATH.PLAYER + constants.ROUTE_PATH.ANONYMOUS + constants.ROUTE_PATH.BYTE_DANCE + constants.ROUTE_PATH.LOGIN;
    } else {
      return;
    }
    if (!self.isPurelyVisual()) return;
    self.enableInteractiveControls(false);
    window.shouldTipOfWsDisconnected = true;

    const theCachedUuid = cc.sys.localStorage.getItem("anonymousCachedUuid"); 
    self.loginParams = {
      cachedUuid: (null == theCachedUuid || "" == theCachedUuid ? null : theCachedUuid)
    };
    
    NetworkUtils.ajax({
      url: url,
      type: "POST",
      data: self.loginParams,
      success: function(resp) {
        self.onLoggedIn(resp);
      },
      timeout: function() {
        self.enableInteractiveControls(true);
      }, 
      error: function() {
        self.enableInteractiveControls(true);
      },
    });
  },

  onLoggedIn(res) {
    const self = this;
    cc.log(`OnLoggedIn ${JSON.stringify(res)}.`)
    if (res.ret === self.retCodeDict.OK) {
      self.enableInteractiveControls(false);
      const date = Number(res.expiresAt);
      const selfPlayer = {
        expiresAt: date,
        playerId: res.playerId,
        intAuthToken: res.intAuthToken
      }
      if (null != res.newUUID && "" != res.newUUID) {
        cc.sys.localStorage.setItem("anonymousCachedUuid", res.newUUID);
      }
      cc.sys.localStorage.setItem("selfPlayer", JSON.stringify(selfPlayer));
      cc.sys.localStorage.setItem("targetPlayerId",  res.playerId);
      console.log('cc.sys.localStorage.selfPlayer = ' + cc.sys.localStorage.getItem("selfPlayer"))
      if (self.countdownTimer) {
        clearInterval(self.countdownTimer);
      }
      const inputControls = self.backgroundNode.getChildByName("InteractiveControls");
      self.backgroundNode.removeChild(inputControls);
      safelyAddChild(self.backgroundNode, self.loadingNode);
      let progressBarNode = self.loadingNode.getChildByName('loadingProgress'),
          progressBarIns = null;
      if (null != progressBarNode) {
        self.loadingNode.getChildByName('loadingSprite').active = false;
        progressBarIns = progressBarNode.getComponent(cc.ProgressBar);
        progressBarIns.progress = 0;
      } else {
        self.loadingNode.getChildByName('loadingSprite').runAction(
          cc.repeatForever(cc.rotateBy(1.0, 360))
        );
      }
      
      let theNextScene = "StageSelection", theMapScene = "StageMap";
      if (self.useIdleGameMap) {
        theNextScene = theMapScene = "IdleGameMap";
      }

      let firstPreloadTotal = 0;
      let firstPreloadCompleted = 0;
      cc.director.preloadScene(theMapScene, function(aCompletedCount, aTotalCount, aItem) {
          firstPreloadTotal = aTotalCount;
          firstPreloadCompleted = aCompletedCount;
          if (null != progressBarIns) {
            progressBarIns.progress = (aCompletedCount/aTotalCount);
            // console.log("progressBarIns.progress is updated to ", progressBarIns.progress); 
          }
        }, function() {
          cc.director.preloadScene(theNextScene, function(bCompletedCount, bTotalCount, bItem) {
            if (null != progressBarIns) {
              progressBarIns.progress = ((bCompletedCount + firstPreloadCompleted)/(bTotalCount + firstPreloadTotal));
              // console.log("progressBarIns.progress is updated to ", progressBarIns.progress); 
            }
          }, function() {
            cc.director.loadScene(theNextScene);
          });
      });
    } else {
      self.enableInteractiveControls(true);
      switch (res.ret) {
        case self.retCodeDict.DUPLICATED:
          this.phoneNumberTips.getComponent(cc.Label).string = constants.ALERT.TIP_LABEL.LOG_OUT;
          break;
        case this.retCodeDict.TOKEN_EXPIRED:
          this.captchaTips.getComponent(cc.Label).string = constants.ALERT.TIP_LABEL.TOKEN_EXPIRED;
          break;
        case this.retCodeDict.SMS_CAPTCHA_NOT_MATCH:
          self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.SMS_CAPTCHA_NOT_MATCH");
          break;
        case this.retCodeDict.INCORRECT_CAPTCHA:
          self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.SMS_CAPTCHA_NOT_MATCH");
          break;
        case this.retCodeDict.SMS_CAPTCHA_CODE_NOT_EXISTING:
          self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.SMS_CAPTCHA_NOT_MATCH");
          break;
        case this.retCodeDict.INCORRECT_PHONE_NUMBER:
          self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.INCORRECT_PHONE_NUMBER");
          break;
        case this.retCodeDict.INVALID_REQUEST_PARAM:
          self.captchaTips.getComponent(cc.Label).string = i18n.t("login.tips.INCORRECT_PHONE_NUMBER");
          break;
        case this.retCodeDict.INCORRECT_PHONE_COUNTRY_CODE:
          this.captchaTips.getComponent(cc.Label).string = constants.ALERT.TIP_LABEL.INCORRECT_PHONE_COUNTRY_CODE;
          break;
        case this.retCodeDict.NONEXISTENT_UUID_CHANNEL_AUTH_PAIR:
          cc.sys.localStorage.removeItem("anonymousCachedUuid");
          break;
        default:
          break;
      }
    }
  },

  getQueryString(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg); //search,查询？后面的参数，并匹配正则
    if (r != null) return unescape(r[2]);
    return null;
  }

});
