cc.Class({
  extends: cc.Component,

  properties: {
    rotationalBubble: {
      type: cc.Node,  
      default: null,
    },
    content: {
      type: cc.Node,
      default: null,
    },
  },
  
  ctor() {
    this.actionable = null;
  },
  
  init(actionable) {
    this.actionable = actionable;
  },

  onClick(evt) {
    const self = this;
    if (null == this.actionable) {
      return;
    }
    if (null == this.actionable.mapIns) {
      return;
    }
    if (null == this.actionable.resourceType) {
      return;
    }
    switch (this.actionable.resourceType) {
      case ACTIONABLE_RESOURCE_TYPE.STATEFUL_BUILDABLE_UPGRADABLE_BY_GOLD:
      this.actionable.mapIns.moveCameraToPosition(this.actionable.positionInMapNode, 0.3, function() {
        if (null == self.actionable.resourceTargetId || null == self.actionable.mapIns.statefulBuildableInstanceCompList) {
          return;
        }
        self.actionable.mapIns.statefulBuildableInstanceCompList.find(function(statefulBuildableInstance) {
          return statefulBuildableInstance.playerBuildableBinding.id == self.actionable.resourceTargetId;
        }).onUpgradableIndicatorButtonClicked(null);
      });
      break;
      case ACTIONABLE_RESOURCE_TYPE.FREEORDER_POPUP_CLICKABLE:
        this.actionable.mapIns.moveCameraToPosition(this.actionable.positionInMapNode);
        break;
      default:
        break;
    }
  },

  update(dt) {
    if (null == this.actionable) {
      return;
    }
    if (false == this.actionable.mapIns.isPurelyVisual()) {
      this.actionable.mapIns.removeActionableBubble(this);
    } else {
      const theNewActionableBubbleIntersection = this.actionable.calculateIntersectedPointOnCanvasEdges();
      if (null == theNewActionableBubbleIntersection) {
        this.actionable.mapIns.removeActionableBubble(this);
      } else {
        this.node.setPosition(theNewActionableBubbleIntersection);
        if (0 == theNewActionableBubbleIntersection.x) {
          set2dRotation(this.rotationalBubble, (0 < theNewActionableBubbleIntersection.y ? 0 : 180));
        } else if (0 == theNewActionableBubbleIntersection.y) {
          set2dRotation(this.rotationalBubble, (0 < theNewActionableBubbleIntersection.x ? 270 : 90));
        } else {
          const slope = (theNewActionableBubbleIntersection.y/theNewActionableBubbleIntersection.x); 
          if (Math.abs(slope) >= 1) {
            if (theNewActionableBubbleIntersection.y > 0) {
              set2dRotation(this.rotationalBubble, 180);
            } else {
              set2dRotation(this.rotationalBubble, 0);
            }   
          } else {
            if (theNewActionableBubbleIntersection.x > 0) {
              set2dRotation(this.rotationalBubble, 270);
            } else {
              set2dRotation(this.rotationalBubble, 90);
            }   
          }
        }  
      }
    }
  },
});
