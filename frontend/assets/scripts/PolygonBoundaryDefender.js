cc.Class({
  extends: cc.Component,
  
  properties: {
    indicator: {
      type: cc.Node,
      default: null,
    },
  },

  // LIFE-CYCLE CALLBACKS:
  ctor() {
    /*
    [WARNING]

    Only one of the followings will be initialized to non-null value.
    */
    this.emitterStatefulBuildable = null;
    this.emitterCharacter = null;

    this.inRangeToAttackTargets = {};
  },

  showIndicator(trueOrFalse) {
    this.indicator.active = trueOrFalse;
  },

  start() {
  },

  onLoad() {
  },

  update(dt) {
  },

  onCollisionEnter(other, self) {
    if (null != this.emitterStatefulBuildable) {
      const targetScriptIns = other.getComponent(other.node.name);
      switch (other.node.name) {
        case "EscapingAttackingNpc":
          if (targetScriptIns.teamId == this.emitterStatefulBuildable.teamId) {
            break;
          }
          this.inRangeToAttackTargets[targetScriptIns.node.uuid] = targetScriptIns; 
          break;
        default:
        break;
      }
      return;
    }

    if (null != this.emitterCharacter) {
      const playerScriptIns = this.emitterCharacter;
      const targetScriptIns = other.getComponent(other.node.name);
      switch (other.node.name) {
        case "EscapingAttackingNpc":
          if (playerScriptIns.teamId == targetScriptIns.teamId) {
            break;
          }
          this.inRangeToAttackTargets[targetScriptIns.node.uuid] = targetScriptIns; 
          playerScriptIns.transitToStaying(); // A prerequisite to call "transitToAttacking".
          playerScriptIns.transitToAttacking();
          break;
        case "StatefulBuildableInstance":
          if (playerScriptIns.teamId == targetScriptIns.teamId) {
            break;
          }
          if (false == targetScriptIns.shouldColliderWithAttackingNpcDefender()) {
            break;
          }
          this.inRangeToAttackTargets[targetScriptIns.node.uuid] = targetScriptIns; 
          playerScriptIns.transitToStaying(); // A prerequisite to call "transitToAttacking".
          playerScriptIns.transitToAttacking();
          break;
        default:
        break;
      }
      return;
    }
  },

  onCollisionStay(other, self) {
    // TBD.
  },

  onCollisionExit(other, self) {
    if (null != this.emitterStatefulBuildable) {
      const playerScriptIns = other.getComponent(other.node.name);
      switch (other.node.name) {
        case "EscapingAttackingNpc":
          if (null != this.inRangeToAttackTargets[playerScriptIns.node.uuid]) {
            delete this.inRangeToAttackTargets[playerScriptIns.node.uuid]; 
          }
          break;
        default:
        break;
      }
      return;
    }

    if (null != this.emitterCharacter) {
      const playerScriptIns = self.getComponent(self.node.name);
      const targetScriptIns = other.getComponent(other.node.name);
      switch (other.node.name) {
        case "EscapingAttackingNpc":
        case "StatefulBuildableInstance":
          if (null != this.inRangeToAttackTargets[targetScriptIns.node.uuid]) {
            delete this.inRangeToAttackTargets[targetScriptIns.node.uuid]; 
          }
          break;
        default:
        break;
      }
      return;
    }
  },
});
