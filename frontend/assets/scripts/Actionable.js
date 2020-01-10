const ACTIONABLE_RESOURCE_TYPE = {
  STATEFUL_BUILDABLE_UPGRADABLE_BY_GOLD: 1,
  FREEORDER_POPUP_CLICKABLE:2,
};
window.ACTIONABLE_RESOURCE_TYPE = ACTIONABLE_RESOURCE_TYPE;

function Actionable() {
  this.mapIns = null;
  this.resourceType = null;
  this.resourceTargetId = null;
  this.positionInMapNode = null;
  this.resourcePtr = null;
}

Actionable.prototype.init = function(mapIns, resourceType, resourceTargetId, positionInMapNode) {
  if (null == mapIns) {
    console.error("[Actionable.init] The input param `mapIns` couldn't be null!");
    return;
  }
  this.mapIns = mapIns;
  this.resourceType = resourceType;
  this.resourceTargetId = resourceTargetId;
  this.positionInMapNode = positionInMapNode;
};

Actionable.prototype.initOrUpdatefromGoldUpgradableStatefulBuildable = function(statefulBuildable) {
  if (null == statefulBuildable) {
    console.error("[Actionable.initOrUpdatefromGoldUpgradableStatefulBuildable] The input param `statefulBuildable` couldn't be null!");
    return;
  }

  this.init(statefulBuildable.mapIns, ACTIONABLE_RESOURCE_TYPE.STATEFUL_BUILDABLE_UPGRADABLE_BY_GOLD, statefulBuildable.playerBuildableBinding.id, statefulBuildable.node.position);

  this.resourcePtr = statefulBuildable;
};

Actionable.prototype.diffVecFromCameraCentreInWidgetsAboveAll = function() {
  if (null == this.mapIns) {
    console.error("[Actionable.diffVecFromCameraCentreInWidgetsAboveAll] The `mapIns` is still null!");
    return;
  }

  const mapIns = this.mapIns;
  const mainCameraContinuousPos = mapIns.ctrl.mainCameraNode.position; // With respect to CanvasNode, but due to that "CanvasNode" and "MapNode" shares the same scale (1,1), this variable also serves as "mainCameraContinuousPosInMapNode".
  const mainCameraContinuousPosInMapNode = mainCameraContinuousPos; 

  const diffVecFromCameraToTargetInMapNode = this.positionInMapNode.sub(mainCameraContinuousPosInMapNode); 
  /**
  * Note that the hierarchy is
  * 
  * - CanvasNode
  *  - MainCameraNode
  *   - WidgetsAboveAll
  *
  * where all nodes directly under "WidgetsAboveAll" should have scale (1,1) if not otherwise specified, yet "WidgetsAboveAll" itself as a child under "MainCameraNode" will be scaled always countering that of "MainCamera.zoomRatio". See "NarrativeSceneManagerDelegate" & "TouchEventsManager._zoomingEvent" for details.
  */
  const diffVecFromCameraToTargetInWidgetsAboveAll = diffVecFromCameraToTargetInMapNode.mul(mapIns.mainCamera.zoomRatio); 

  return diffVecFromCameraToTargetInWidgetsAboveAll;
};

Actionable.prototype.calculateIntersectedPointOnCanvasEdges = function() {
  if (null == this.mapIns) {
    console.error("[Actionable.calculateIntersectedPointOnCanvasEdges] The `mapIns` is still null!");
    return null;
  }

  const contractionRatioY = 0.9;
  const contractionRatioX = 0.8;

  const diffVecFromCameraToTargetInWidgetsAboveAll = this.diffVecFromCameraCentreInWidgetsAboveAll();
  const halfCanvasW = 0.5*mapIns.node.parent.width;
  const halfCanvasH = 0.5*mapIns.node.parent.height;
  if (Math.abs(diffVecFromCameraToTargetInWidgetsAboveAll.x) < halfCanvasW && Math.abs(diffVecFromCameraToTargetInWidgetsAboveAll.y) < halfCanvasH) {
    // No intersection.
    return null;
  } else if (0 == diffVecFromCameraToTargetInWidgetsAboveAll.x) {
    const intersectionPointY = (diffVecFromCameraToTargetInWidgetsAboveAll.y >= halfCanvasH) ? halfCanvasH : -halfCanvasH;   
    return cc.v2(0, intersectionPointY).mul(contractionRatioY);
  } else if (0 == diffVecFromCameraToTargetInWidgetsAboveAll.y) {
    const intersectionPointX = (diffVecFromCameraToTargetInWidgetsAboveAll.x >= halfCanvasW) ? halfCanvasW : -halfCanvasW;   
    return cc.v2(intersectionPointX, 0).mul(contractionRatioX);
  } else {
    const slope = (diffVecFromCameraToTargetInWidgetsAboveAll.y/diffVecFromCameraToTargetInWidgetsAboveAll.x); 

    if (1 <= Math.abs(slope)) {
      if (diffVecFromCameraToTargetInWidgetsAboveAll.y >= halfCanvasH) {
        return cc.v2((halfCanvasH/slope)*contractionRatioX, halfCanvasH*contractionRatioY);
      } else {
        return cc.v2((-halfCanvasH/slope)*contractionRatioX, -halfCanvasH*contractionRatioY);
      }   
    } else {
      if (diffVecFromCameraToTargetInWidgetsAboveAll.x >= halfCanvasW) {
        return cc.v2(contractionRatioX*halfCanvasW, halfCanvasW*slope*contractionRatioY);
      } else {
        return cc.v2(-halfCanvasW*contractionRatioX, -halfCanvasW*slope*contractionRatioY);
      }   
    }
  } 
};

Actionable.prototype.stillActionable = function() {
  if (null == this.mapIns) {
    console.error("[Actionable.stillActionable] The `mapIns` is still null!");
    return false;
  }
  if (null == this.resourcePtr) {
    console.error("[Actionable.stillActionable] The `resourcePtr` is still null!");
    return false;
  }
  switch (this.resourceType) {
    case ACTIONABLE_RESOURCE_TYPE.STATEFUL_BUILDABLE_UPGRADABLE_BY_GOLD:
      const statefulBuildable = this.resourcePtr;
      return statefulBuildable.isUpgradableByGoldOnly(); 
    break;
    default:
    return false;
  }
};

window.Actionable = Actionable;
