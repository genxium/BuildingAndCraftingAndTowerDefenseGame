cc.Class({
  extends: cc.Component,
  properties: {
    // For joystick begins.
    translationListenerNode: {
      default: null,
      type: cc.Node
    },
    zoomingListenerNode: {
      default: null,
      type: cc.Node
    },
    stickhead: {
      default: null,
      type: cc.Node
    },
    joyStickEps: {
      default: 0.10,
      type: cc.Float
    },
    magicLeanLowerBound: {
      default: 0.414, // Tangent of (PI/8).
      type: cc.Float
    },
    magicLeanUpperBound: {
      default: 2.414, // Tangent of (3*PI/8).
      type: cc.Float
    },
    // For joystick ends.
    pollerFps: {
      default: 10,
      type: cc.Integer
    },
    minScale: {
      default: 1.00,
      type: cc.Float
    },
    maxScale: {
      default: 2.50,
      type: cc.Float
    },
    maxMovingBufferLength: {
      default: 1,
      type: cc.Integer
    },
    zoomingScaleFacBase: {
      default: 0.10,
      type: cc.Float
    },
    zoomingSpeedBase: {
      default: 4.0,
      type: cc.Float
    },
    linearSpeedBase: {
      default: 320.0,
      type: cc.Float
    },
    linearMovingEps: {
      default: 0.10,
      type: cc.Float
    },
    scaleByEps: {
      default: 0.0375,
      type: cc.Float
    },
  },

  start() {},

  init(mapScriptIns, mapNode, canvasNode) {
    this.mapNode = mapNode;
    this.canvasNode = canvasNode;
    this.translationListenerNode = mapScriptIns.translationListenerNode == null ? mapNode : mapScriptIns.translationListenerNode;
    this.zoomingListenerNode = mapScriptIns.zoomingListenerNode == null ? mapNode : mapScriptIns.zoomingListenerNode;
    // This is a dirty fix!
    this.mapScriptIns = mapScriptIns;
    this.cachedStickHeadPosition = cc.v2(0.0, 0.0);
    this.mainCameraNode = mapScriptIns.mainCameraNode; // Cannot drag and assign the `mainCameraNode` from CocosCreator EDITOR directly, otherwise it'll cause an infinite loading time, till v2.1.0.
    this.mainCamera = mapScriptIns.mainCamera;
    this.activeDirection = {
      dx: 0.0,
      dy: 0.0
    };
    this.initCameraAutoTranslationData();
    this._initTouchEvent();

    this.initialized = true;
  },

  _isTouchEnabled() {
    const self = this;
    if (false == self.mapScriptIns.isPurelyVisual()) {
      if (
        false == self.mapScriptIns.isFloatingModalPopup() 
          && 
        false == self.mapScriptIns.isInCombo()
          &&
        false == self.mapScriptIns.isInScouting()
        ) {
        return false;
      }
    }
    return true;
  },


  onLoad() {
    // TBD.
  },

  onDestroy() {
    clearInterval(this.mainLoopTimer);
  },

  _initTouchEvent() {
    const self = this;
    const translationListenerNode = (self.translationListenerNode ? self.translationListenerNode : self.mapNode);
    const zoomingListenerNode = (self.zoomingListenerNode ? self.zoomingListenerNode : self.mapNode);

    translationListenerNode.inTouchPoints = new Map();
    translationListenerNode.on(cc.Node.EventType.TOUCH_START, function(event) {
      self._touchStartEvent(event, translationListenerNode);
    }, self, true);
    translationListenerNode.on(cc.Node.EventType.TOUCH_MOVE, function(event) {
      self._translationEvent(event, translationListenerNode);
    },self, true);
    translationListenerNode.on(cc.Node.EventType.TOUCH_END, function(event) {
      self._touchEndEvent(event, translationListenerNode);
    }, self, true);
    translationListenerNode.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
      self._touchEndEvent(event, translationListenerNode);
    }, self, true);

    zoomingListenerNode.inTouchPoints = new Map();
    zoomingListenerNode.on(cc.Node.EventType.TOUCH_START, function(event) {
      self._touchStartEvent(event, zoomingListenerNode);
    }, self, true);
    zoomingListenerNode.on(cc.Node.EventType.TOUCH_MOVE, function(event) {
      self._zoomingEvent(event, zoomingListenerNode);
    }, self, true);
    zoomingListenerNode.on(cc.Node.EventType.TOUCH_END, function(event) {
      self._touchEndEvent(event, zoomingListenerNode);
    }, self, true);
    zoomingListenerNode.on(cc.Node.EventType.TOUCH_CANCEL, function(event) {
      self._touchEndEvent(event, zoomingListenerNode);
    }, self, true);
  },

  _touchStartEvent(event, theListenerNode) {
    const self = this;
    if (null == theListenerNode) {
      theListenerNode = event.target;
    }
    if (!theListenerNode || !theListenerNode.inTouchPoints) return;
    for (let touch of event._touches) {
      theListenerNode.inTouchPoints.set(touch._id, touch);
    }
    const touchLocation = event._touches[0].getLocation();
    const touchPosInCamera = cc.v2(touchLocation.x, touchLocation.y).sub(cc.v2(self.canvasNode.width * self.canvasNode.anchorX, self.canvasNode.height * self.canvasNode.anchorY)).div(self.mainCamera.zoomRatio);
    
    if (null != self.mapScriptIns.findStatefulBuildableInstanceAtPosition) {
      theListenerNode.statefulBuildableInstanceAtTouchStart = self.mapScriptIns.findStatefulBuildableInstanceAtPosition(touchPosInCamera);
    }

    if (self.mapScriptIns.widgetsAboveAllScriptIns.walletInfo.goldTip.active == true) {
      window.removeCurrentlyShowingQuantityLimitPopup();
    }
    if (self.mapScriptIns.isShowingModalPopup()) {
      event && event.stopPropagation();
      return;
    }
  },

  isMapOverMoved(cameraPos) {
    return tileCollisionManager.cameraIsOutOfGrandBoundary(this.mapNode, cameraPos.sub(this.mapNode.position));
  },

  _translationEvent(event, theListenerNode) {
    const self = this;
    if (null == theListenerNode) {
      theListenerNode = event.target;
    }
    if (self.mapScriptIns.isShowingModalPopup()) {
      event && event.stopPropagation();
      return;
    }
    if (event.getStartLocation().sub(event.getLocation()).mag() <= self.linearMovingEps) {
      return;
    }

    if (!theListenerNode || !theListenerNode.inTouchPoints) return;
    if (1 != theListenerNode.inTouchPoints.size) {
      return;
    }
    if (!theListenerNode.inTouchPoints.has(event.currentTouch._id)) {
      return;
    }

    const immediateDiffVec = event.currentTouch.getDelta(); // On screen coordinates, reference https://docs.cocos.com/creator/2.1/api/en/?q=touch.
    // Guoyl6: I think the translation of mainCameraNode should care about it's zoomRatio too
    const transformedImmediateDiffVec = immediateDiffVec.div(self.mainCamera.zoomRatio);

    const touchLocation = event.currentTouch.getLocation();
    const touchPosInCamera = cc.v2(touchLocation.x, touchLocation.y).sub(cc.v2(self.canvasNode.width * self.canvasNode.anchorX, self.canvasNode.height * self.canvasNode.anchorY)).div(self.mainCamera.zoomRatio);

    if (this._isTouchEnabled()) {
      const cameraPos = self.mainCameraNode.position.sub(transformedImmediateDiffVec);
      if (self.mapScriptIns.isInNarrativeScene()) {
        return;
      }
      if (self.isMapOverMoved(cameraPos)) {
        self.mapScriptIns.onMapOverMoved && self.mapScriptIns.onMapOverMoved();
        return;
      }
      self.mainCameraNode.setPosition(cameraPos);
    } else if (
         self.mapScriptIns.isPositioningNewStatefulBuildableInstance()
      || self.mapScriptIns.isEditingExistingStatefulBuildableInstance()
    ) {
      if (null != self.mapScriptIns.onMovingBuildableInstance) {
        if (!self.isCameraAutoMoveEnable() || !self.tryStartCameraAutoMove(event, theListenerNode, touchLocation, touchPosInCamera)) {
          self.cancelCameraAutoMove();
        }
        self.mapScriptIns.onMovingBuildableInstance(touchPosInCamera, transformedImmediateDiffVec, theListenerNode.statefulBuildableInstanceAtTouchStart);
      }
    } else if (self.mapScriptIns.isDraggingIngredient()) {
      if (null != self.mapScriptIns.onDraggingIngredient) {
        if (self.mapScriptIns.isDraggingIngredientInsideCancelArea() || !self.isCameraAutoMoveEnable() || !self.tryStartCameraAutoMove(event, theListenerNode, touchLocation, touchPosInCamera)) {
          self.cancelCameraAutoMove();
        }
        self.mapScriptIns.onDraggingIngredient(touchPosInCamera, transformedImmediateDiffVec);
      }
    } else {
      // Deliberately left blank. -- YFLu, 2019-10-02
    }
  },

  _zoomingEvent(event, theListenerNode) {
    if (!this._isTouchEnabled()) {
      return;
    }
    if (null == theListenerNode) {
      theListenerNode = event.target;
    }
    if (!theListenerNode || !theListenerNode.inTouchPoints) return;
    if (2 != theListenerNode.inTouchPoints.size) {
      return;
    }
    if (2 == event._touches.length) {
      const firstTouch = event._touches[0];
      const secondTouch = event._touches[1];

      const startMagnitude = firstTouch._startPoint.sub(secondTouch._startPoint).mag();
      const currentMagnitude = firstTouch._point.sub(secondTouch._point).mag();

      /* 
       * Although I have no way accessing the linear factor where "startMagnitude & currentMagnitude" scales from 
       * the `mapNode` or `canvasNode` magnitudes, the following calculation for `scaleBy` eliminates the common factor.    
       *  -- YFLu
       */
      let scaleBy = (currentMagnitude / startMagnitude);
      scaleBy = 1 + (scaleBy - 1) * this.zoomingScaleFacBase;
      if (1 < scaleBy && Math.abs(scaleBy - 1) < this.scaleByEps) {
        // Jitterring.
        cc.log(`Spot #1 ScaleBy == ${scaleBy} from startMagnitude == ${startMagnitude} and currentMagnitude = ${currentMagnitude} is just jittering.`);
        return;
      }
      if (1 > scaleBy && Math.abs(scaleBy - 1) < 0.5 * this.scaleByEps) {
        // Jitterring.
        cc.log(`Spot #2 ScaleBy == ${scaleBy} from startMagnitude == ${startMagnitude} and currentMagnitude = ${currentMagnitude} is just jittering.`);
        return;
      }
      if (!this.mainCamera) return;
      const targetScale = this.mainCamera.zoomRatio * scaleBy;
      if (this.minScale > targetScale || targetScale > this.maxScale) {
        cc.log(`Spot #3 ScaleBy == ${scaleBy} from startMagnitude == ${startMagnitude} and currentMagnitude = ${currentMagnitude}, when this.mainCamera.zoomRatio == ${this.mainCamera.zoomRatio} is too tiny or too large.`);
        return;
      }
      this.mainCamera.zoomRatio = targetScale;
      for (let child of this.mainCameraNode.children) {
        if ("coverVideoNode" == child.getName()) continue; // A dirty hack.
        child.setScale(1 / targetScale);
      }
    }
  },

  _touchEndEvent(event, theListenerNode) {
    const self = this;
    self.cancelCameraAutoMove();
    if (null == theListenerNode) {
      theListenerNode = event.target;
    }
    if (!theListenerNode || !theListenerNode.inTouchPoints) {
      return;
    }
    do {
      if (!theListenerNode.inTouchPoints.has(event.currentTouch._id)) {
        break;
      }
      /*
      if (!this._isTouchEnabled()) {
        break;
      }
      */
      const diffVec = event.currentTouch._point.sub(event.currentTouch._startPoint);
      const diffVecMag = diffVec.mag();
      if (this.linearMovingEps <= diffVecMag) {
        break;
      }
      // Only triggers map-state-switch when `diffVecMag` is sufficiently small.

      // TODO: Handle single-finger-click event.
      const touchLocation = event.currentTouch.getLocation();
      const touchPosWrtCameraCentre = cc.v2(touchLocation.x, touchLocation.y).sub(cc.v2(self.canvasNode.width * self.canvasNode.anchorX, self.canvasNode.height * self.canvasNode.anchorY));
      const touchPosWrtCameraCentreScaledToMapNode = touchPosWrtCameraCentre.div(self.mainCamera.zoomRatio); 
      self.mapScriptIns.onSingleFingerClick(event, touchPosWrtCameraCentreScaledToMapNode);
    } while (false);
    this.cachedStickHeadPosition = cc.v2(0.0, 0.0);
    for (let touch of event._touches) {
      if (touch) {
        theListenerNode.inTouchPoints.delete(touch._id);
      }
    }
    theListenerNode.statefulBuildableInstanceAtTouchStart = null;
    if (self.mapScriptIns.isShowingModalPopup()) {
      event && event.stopPropagation();
    }
  },

  _touchCancelEvent(event) {
    this.mapNode.dispatchEvent(event);
    this.cancelCameraAutoMove();
  },

  update(dt) {
    const self = this;
    if (true != this.initialized) return;
    this.cameraAutoTranslationTick();
    if (1 < this.zoomingListenerNode.inTouchPoints.size) return;
  },

  discretizeDirection(continuousDx, continuousDy, eps) {
    let ret = {
      dx: 0,
      dy: 0,
    };
    if (Math.abs(continuousDx) < eps) {
      ret.dx = 0;
      ret.dy = continuousDy > 0 ? +1 : -1;
    } else if (Math.abs(continuousDy) < eps) {
      ret.dx = continuousDx > 0 ? +2 : -2;
      ret.dy = 0;
    } else {
      const criticalRatio = continuousDy / continuousDx;
      if (criticalRatio > this.magicLeanLowerBound && criticalRatio < this.magicLeanUpperBound) {
        ret.dx = continuousDx > 0 ? +2 : -2;
        ret.dy = continuousDx > 0 ? +1 : -1;
      } else if (criticalRatio > -this.magicLeanUpperBound && criticalRatio < -this.magicLeanLowerBound) {
        ret.dx = continuousDx > 0 ? +2 : -2;
        ret.dy = continuousDx > 0 ? -1 : +1;
      } else {
        if (Math.abs(criticalRatio) < 1) {
          ret.dx = continuousDx > 0 ? +2 : -2;
          ret.dy = 0;
        } else {
          ret.dx = 0;
          ret.dy = continuousDy > 0 ? +1 : -1;
        }
      }
    }
    return ret;
  },
  initCameraAutoTranslationData() {
    const self = this;
    self.cameraAutoTranslation = constants.CAMERA_AUTO_TRANSLATION;
    self.cameraAutoTranslationData = {
      lastCalledAt: null,
      diffVec: cc.v2(0, 0),
      touchPosInCamera: cc.v2(0, 0),
      getNextCameraPos() {
        return self.mainCameraNode.getPosition().add(self.cameraAutoTranslationData.diffVec);
      },
      event: null,
      theListenerNode: null,
    };
  },

  cameraAutoTranslationTick() {
    const self = this,
      event = self.cameraAutoTranslationData.event;
    if (
      event
      && self.cameraAutoTranslationData.lastCalledAt
      && self.cameraAutoTranslationData.lastCalledAt + self.cameraAutoTranslation.MOVE_INTERVAL_MILLS <= Date.now()
    ) {
      const theListenerNode = self.cameraAutoTranslationData.theListenerNode;
      let { diffVec, touchPosInCamera, getNextCameraPos } = self.cameraAutoTranslationData;
      let nextCameraPos = getNextCameraPos();
      if (!(self.mapScriptIns.isDraggingIngredient() || self.mapScriptIns.isPositioningNewStatefulBuildableInstance() || self.mapScriptIns.isEditingExistingStatefulBuildableInstance())) {
        return;
      }
      if (self.isMapOverMoved(nextCameraPos) || self.mapScriptIns.isEditingStatefulBuildableInstanceNodeOnBoundary()) {
        return;
      }
      self.cameraAutoTranslationData.lastCalledAt = Date.now();
      if (
          (theListenerNode.statefulBuildableInstanceAtTouchStart == self.mapScriptIns.editingStatefulBuildableInstance || theListenerNode.statefulBuildableInstanceAtTouchStart == self.mapScriptIns.phantomEditingStatefulBuildableInstance) &&
          (self.mapScriptIns.isPositioningNewStatefulBuildableInstance() || self.mapScriptIns.isEditingExistingStatefulBuildableInstance())
       && null != self.mapScriptIns.onMovingBuildableInstance
      ) {
        self.mainCameraNode.setPosition(nextCameraPos);
        self.mapScriptIns.onMovingBuildableInstance(touchPosInCamera, diffVec, theListenerNode.statefulBuildableInstanceAtTouchStart);
      } else if (self.mapScriptIns.isDraggingIngredient() && self.mapScriptIns.onDraggingIngredient) {
        self.mainCameraNode.setPosition(nextCameraPos);
        self.mapScriptIns.onDraggingIngredient(touchPosInCamera, diffVec);
      } else {
        self.cancelCameraAutoMove();
      }
    }
  },
  /*
   * return: true if in boundary, false else.
   * */
  tryStartCameraAutoMove(event, theListenerNode, touchLocation, touchPosInCamera) {
    const self = this;
    const {BOUNDARY_WEIGHT, FAST_MOVE_BOUNDARY_WEIGHT, MOVE_PIXELS} = self.cameraAutoTranslation;
    let percentage = {
      vertical: touchLocation.y / self.canvasNode.height,
      horizontal: touchLocation.x / self.canvasNode.width,
    };
    let isOverBoundary = {
      top: (1 - percentage.vertical) <= BOUNDARY_WEIGHT,
      bottom: percentage.vertical <= BOUNDARY_WEIGHT,
      left: percentage.horizontal <= BOUNDARY_WEIGHT,
      right: (1 - percentage.horizontal) <= BOUNDARY_WEIGHT,
    };
    if (!(isOverBoundary.top || isOverBoundary.bottom || isOverBoundary.left || isOverBoundary.right)) {
      return false;
    }
    let isFastMove = {
      top: (1 - percentage.vertical) / BOUNDARY_WEIGHT <= FAST_MOVE_BOUNDARY_WEIGHT,
      bottom: percentage.vertical / BOUNDARY_WEIGHT <= FAST_MOVE_BOUNDARY_WEIGHT,
      left: percentage.horizontal / BOUNDARY_WEIGHT <= FAST_MOVE_BOUNDARY_WEIGHT,
      right: (1 - percentage.horizontal) / BOUNDARY_WEIGHT <= FAST_MOVE_BOUNDARY_WEIGHT,
    };
    let diffVec = cc.v2(0, 0);
    if (isOverBoundary.left) {
      diffVec.x -= MOVE_PIXELS * (isFastMove.left ? 2 : 1);
    }
    if (isOverBoundary.right) {
      diffVec.x += MOVE_PIXELS * (isFastMove.right ? 2 : 1);
    }
    if (isOverBoundary.top) {
      diffVec.y += MOVE_PIXELS * (isFastMove.top ? 2 : 1);
    }
    if (isOverBoundary.bottom) {
      diffVec.y -= MOVE_PIXELS * (isFastMove.bottom ? 2 : 1);
    }
    diffVec = diffVec.div(self.mainCamera.zoomRatio);
    self.cameraAutoTranslationData.lastCalledAt = self.cameraAutoTranslationData.lastCalledAt || Date.now();
    self.cameraAutoTranslationData.diffVec = diffVec;
    self.cameraAutoTranslationData.touchPosInCamera = touchPosInCamera;
    self.cameraAutoTranslationData.event = event;
    self.cameraAutoTranslationData.theListenerNode = theListenerNode;
    return true;
  },
  cancelCameraAutoMove() {
    const self = this;
    self.cameraAutoTranslationData.lastCalledAt = null;
    self.cameraAutoTranslationData.event = null;
    self.cameraAutoTranslationData.theListenerNode = null;
  },
  isCameraAutoMoveEnable() {
    const self = this;
    return self.mapScriptIns.cameraAutoMove && !self.mapScriptIns.isInNarrativeScene();
  },

});
